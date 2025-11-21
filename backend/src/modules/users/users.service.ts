import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async healthCheck() {
    const totalUsers = await this.prisma.user.count();
    return { status: 'ok', totalUsers };
  }
}
