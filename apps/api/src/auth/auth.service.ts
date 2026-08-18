import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { prisma } from '@yurian/database';
import type { TokenPair } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const scrypt = promisify(nodeScrypt);

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

@Injectable()
export class AuthService {
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
    // Token issuance is intentionally isolated. JWT signing/rotation will be wired here
    // with server-only secrets and persistent refresh-token records.
    return {
      accessToken: `pending:${userId}`,
      refreshToken: `pending:${randomBytes(32).toString('hex')}`,
      expiresIn: 900,
    };
  }
}
