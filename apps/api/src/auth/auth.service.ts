import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from '@yurian/database';
import type { TokenPair } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const scrypt = promisify(nodeScrypt);
const REFRESH_DAYS = 30;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const email = dto.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const user = await prisma.user.create({
      data: { email, name: dto.name.trim(), passwordHash: await hashPassword(dto.password) },
    });
    return this.issueSession(user.id);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user?.passwordHash || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueSession(user.id);
  }

  private async issueSession(userId: string): Promise<TokenPair> {
    const sessionId = randomBytes(24).toString('hex');
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 86400000);

    await prisma.session.create({
      data: { id: sessionId, userId, refreshTokenHash: hashToken(refreshToken), expiresAt },
    });

    const accessToken = await this.jwt.signAsync({ sub: userId, sid: sessionId });
    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
