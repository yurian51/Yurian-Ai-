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

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const email = dto.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const baseSlug = slugify(dto.name) || `workspace-${randomBytes(4).toString('hex')}`;
    const suffix = randomBytes(3).toString('hex');
    const organization = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: dto.name.trim(), passwordHash: await hashPassword(dto.password) },
      });
      const org = await tx.organization.create({
        data: { name: `${dto.name.trim()}'s Organization`, slug: `${baseSlug}-${suffix}` },
      });
      await tx.membership.create({ data: { organizationId: org.id, userId: user.id, role: 'OWNER' } });
      await tx.workspace.create({ data: { organizationId: org.id, name: 'Personal Workspace', slug: 'personal' } });
      return org;
    });

    return this.issueSession((await prisma.user.findUniqueOrThrow({ where: { email } })).id, organization.id);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() }, include: { memberships: { orderBy: { createdAt: 'asc' }, take: 1 } } });
    if (!user?.passwordHash || !(await verifyPassword(dto.password, user.passwordHash)) || !user.memberships[0]) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueSession(user.id, user.memberships[0].organizationId);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(refreshToken);
    const session = await prisma.session.findUnique({ where: { refreshTokenHash: tokenHash }, include: { user: { include: { memberships: { orderBy: { createdAt: 'asc' }, take: 1 } } } } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.memberships[0]) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issueSession(session.userId, session.user.memberships[0].organizationId);
  }

  private async issueSession(userId: string, organizationId: string): Promise<TokenPair> {
    const sessionId = randomBytes(24).toString('hex');
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 86400000);
    await prisma.session.create({ data: { id: sessionId, userId, refreshTokenHash: hashToken(refreshToken), expiresAt } });
    const accessToken = await this.jwt.signAsync({ sub: userId, sid: sessionId, org: organizationId });
    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
