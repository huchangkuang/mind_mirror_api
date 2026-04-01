import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../../shared/exceptions/app.exception';
import { AppErrorCode } from '../../shared/constants/error-codes';
import { hashPassword, verifyPassword } from './password.util';
import { JwtUserPayload } from './types';

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(usernameRaw: string, password: string): Promise<TokenPair> {
    const username = usernameRaw.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { username } });
    if (exists) {
      throw new AppException(AppErrorCode.CONFLICT, '用户名已存在');
    }

    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
      },
    });

    return this.issueTokenPair(user.id, user.username);
  }

  async login(usernameRaw: string, password: string): Promise<TokenPair> {
    const username = usernameRaw.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return this.issueTokenPair(user.id, user.username);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(refreshToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenId: payload.tid },
      include: { user: true },
    });
    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt < new Date() ||
      !verifyPassword(refreshToken, tokenRecord.tokenHash)
    ) {
      throw new UnauthorizedException('refresh token 无效');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(tokenRecord.user.id, tokenRecord.user.username);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = this.verifyRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenId: payload.tid },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppException(AppErrorCode.RESOURCE_NOT_FOUND, '用户不存在');

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
    };
  }

  async updateNickname(userId: number, nickname: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nickname: nickname.trim() },
    });
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppException(AppErrorCode.RESOURCE_NOT_FOUND, '用户不存在');
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('当前密码不正确');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: hashPassword(newPassword) },
      });
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  private async issueTokenPair(userId: number, username: string): Promise<TokenPair> {
    const payload: JwtUserPayload = { sub: userId, username };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET ?? 'dev_access_secret',
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as never,
    });

    const tokenId = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, tid: tokenId },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as never,
      },
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenId,
        tokenHash: hashPassword(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(refreshToken: string): { sub: number; tid: string } {
    try {
      return this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('refresh token 无效');
    }
  }
}
