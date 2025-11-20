import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;
  private readonly redirectUri: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const port = this.configService.get<string>('PORT');
    const backendUrl = port ? `http://localhost:${port}` : 'http://localhost:3001';
    const redirectUri = `${backendUrl}/api/auth/google/callback`;
    this.redirectUri = redirectUri;

    if (!clientId || !clientSecret) {
      console.warn('Google OAuth credentials not configured. OAuth flow will not work.');
    }

    this.oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  getAuthUrl(userId?: string, forSignIn: boolean = false): string {
    const scopes = forSignIn
      ? ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
      : [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ];

    const state = userId
      ? Buffer.from(JSON.stringify({ userId, forSignIn })).toString('base64')
      : Buffer.from(JSON.stringify({ forSignIn: true })).toString('base64');

    console.log('Generating OAuth URL with redirect URI:', this.redirectUri);
    console.log('For sign-in:', forSignIn);

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  async handleCallback(code: string, state: string): Promise<{ userId: string; email: string }> {
    try {
      // Decode state to get userId (if connecting existing account) or null (if signing in)
      let userId: string | null = null;
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = stateData.userId || null;
      } catch (e) {
        // State might be empty or invalid - this is OK for sign-in flow
        console.log('No userId in state, treating as sign-in flow');
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new BadRequestException('Failed to get OAuth access token');
      }

      // Get user info
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      if (!userInfo.data.email) {
        throw new BadRequestException('Email not provided by Google');
      }

      // If userId provided, update existing user (calendar connection)
      if (userId) {
        // Verify user exists
        const existingUser = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!existingUser) {
          throw new BadRequestException('User not found');
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token || null,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            googleId: userInfo.data.id || undefined,
          },
        });

        return {
          userId,
          email: userInfo.data.email,
        };
      }

      // Otherwise, this is a sign-in flow - return user info for sign-in
      return {
        userId: '', // Will be handled by sign-in endpoint
        email: userInfo.data.email,
      };
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage =
        (error?.response?.data?.error_description as string) ||
        (error?.response?.data?.error as string) ||
        error?.message;

      if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('invalid_grant')) {
        throw new BadRequestException(
          `Invalid authorization code. This usually means:
1. The redirect URI in Google Cloud Console must match exactly: ${this.redirectUri}
2. The authorization code may have expired (try again)
3. The code may have already been used`,
        );
      }

      throw new InternalServerErrorException(errorMessage || 'Failed to process OAuth callback');
    }
  }

  async handleSignInCallback(code: string): Promise<{ accessToken: string; user: any; googleTokens: any }> {
    try {
      console.log('Starting Google Sign-In callback processing...');
      
      // Exchange code for tokens
      let tokens;
      try {
        console.log('Attempting to exchange code for tokens...');
        console.log('Redirect URI configured:', this.redirectUri);
        const tokenResponse = await this.oauth2Client.getToken(code);
        tokens = tokenResponse.tokens;
        console.log('Successfully exchanged code for tokens');
      } catch (tokenError: any) {
        console.error('Token exchange error:', tokenError);
        console.error('Error details:', {
          message: tokenError?.message,
          code: tokenError?.code,
          response: tokenError?.response?.data,
        });
        
        // Provide more helpful error message
        if (tokenError?.message?.includes('invalid_grant')) {
          throw new BadRequestException(
            'Invalid authorization code. This usually means:\n' +
            '1. The redirect URI in Google Cloud Console must match exactly: http://localhost:3001/api/auth/google/callback\n' +
            '2. The authorization code may have expired (try again)\n' +
            '3. The code may have already been used'
          );
        }
        
        throw new BadRequestException(`Failed to exchange authorization code: ${tokenError?.message || 'Unknown error'}`);
      }

      if (!tokens.access_token) {
        throw new BadRequestException('Failed to get OAuth access token');
      }

      // Get user info
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      
      let userInfo;
      try {
        userInfo = await oauth2.userinfo.get();
        console.log('Successfully retrieved user info:', userInfo.data.email);
      } catch (userInfoError: any) {
        console.error('User info retrieval error:', userInfoError);
        throw new BadRequestException(`Failed to get user info: ${userInfoError?.message || 'Unknown error'}`);
      }

      if (!userInfo.data.email) {
        throw new BadRequestException('Email not provided by Google');
      }

      // Find or create user
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { email: userInfo.data.email },
        });

        if (!user) {
          // Create new user
          console.log('Creating new user:', userInfo.data.email);
          user = await this.prisma.user.create({
            data: {
              email: userInfo.data.email,
              firstName: userInfo.data.given_name || null,
              lastName: userInfo.data.family_name || null,
              googleId: userInfo.data.id || null,
              googleAccessToken: tokens.access_token,
              googleRefreshToken: tokens.refresh_token || null,
              googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
              role: 'USER',
            },
          });
          console.log('User created successfully:', user.id);
        } else {
          // Update existing user with Google info
          console.log('Updating existing user:', user.id);
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: userInfo.data.id || user.googleId,
              googleAccessToken: tokens.access_token,
              googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
              googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : user.googleTokenExpiry,
              firstName: userInfo.data.given_name || user.firstName,
              lastName: userInfo.data.family_name || user.lastName,
            },
          });
          console.log('User updated successfully');
        }
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        throw new InternalServerErrorException(`Database error: ${dbError?.message || 'Unknown error'}`);
      }

      // Generate JWT token
      let accessToken;
      try {
        accessToken = this.jwtService.sign({
          sub: user.id,
          email: user.email,
          role: user.role,
        });
        console.log('JWT token generated successfully');
      } catch (jwtError: any) {
        console.error('JWT generation error:', jwtError);
        throw new InternalServerErrorException(`Failed to generate access token: ${jwtError?.message || 'Unknown error'}`);
      }

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        googleTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
      };
    } catch (error: any) {
      console.error('Google Sign-In callback error:', error);
      console.error('Error stack:', error?.stack);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process Google Sign-In: ${error?.message || 'Unknown error'}`);
    }
  }

  async getAccessToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!user?.googleAccessToken) {
      return null;
    }

    // Check if token is expired
    if (user.googleTokenExpiry && user.googleTokenExpiry < new Date()) {
      // Refresh token
      if (!user.googleRefreshToken) {
        return null;
      }

      try {
        this.oauth2Client.setCredentials({
          refresh_token: user.googleRefreshToken,
        });

        const { credentials } = await this.oauth2Client.refreshAccessToken();

        // Update stored tokens
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            googleAccessToken: credentials.access_token || null,
            googleRefreshToken: credentials.refresh_token || user.googleRefreshToken,
            googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          },
        });

        return credentials.access_token || null;
      } catch (error: any) {
        console.error('Failed to refresh OAuth token:', error);
        return null;
      }
    }

    return user.googleAccessToken;
  }

  async getAuthClient(userId: string): Promise<OAuth2Client | null> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) {
      return null;
    }

    const client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET'),
    );

    client.setCredentials({
      access_token: accessToken,
    });

    return client;
  }

  async hasOAuthTokens(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleRefreshToken: true,
      },
    });

    return !!user?.googleRefreshToken;
  }
}

