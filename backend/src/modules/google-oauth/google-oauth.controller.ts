import { Controller, Get, Query, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoogleOAuthService } from './google-oauth.service';

@Controller('auth/google')
export class GoogleOAuthController {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('authorize')
  authorize(@Request() req: { user: { userId: string } }) {
    try {
      const authUrl = this.googleOAuthService.getAuthUrl(req.user.userId);
      // Return redirect URL in JSON response for frontend to handle
      return { redirectUrl: authUrl };
    } catch (error: any) {
      console.error('Error generating OAuth URL:', error);
      throw error;
    }
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent('Missing authorization code')}`);
    }

    try {
      // Check if this is a sign-in flow or calendar connection
      let stateData: any = {};
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch (e) {
        // Invalid state, treat as sign-in
        stateData = { forSignIn: true };
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (stateData.forSignIn) {
        // Sign-in flow
        const result = await this.googleOAuthService.handleSignInCallback(code);
        // Redirect to frontend with token in URL (frontend will handle storing it)
        return res.redirect(`${frontendUrl}/auth/google/callback?token=${encodeURIComponent(result.accessToken)}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
      } else {
        // Calendar connection flow
        const result = await this.googleOAuthService.handleCallback(code, state);
        return res.redirect(`${frontendUrl}/dashboard?google_connected=true`);
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        response: error?.response,
      });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = error?.message || 'Failed to process Google Sign-In';
      return res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  @Get('signin')
  signIn(@Res() res: Response) {
    // Generate OAuth URL for sign-in (no userId needed)
    const authUrl = this.googleOAuthService.getAuthUrl(undefined, true);
    res.redirect(authUrl);
  }
}

