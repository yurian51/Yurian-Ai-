import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from './auth.types';

export type AuthenticatedRequest = Request & { user: AuthenticatedPrincipal };

type AccessClaims = { sub: string; sid: string; org: string; roles?: string[] };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const claims = await this.jwt.verifyAsync<AccessClaims>(header.slice(7));
      if (!claims.sub || !claims.sid || !claims.org) throw new UnauthorizedException();
      request.user = { userId: claims.sub, sessionId: claims.sid, organizationId: claims.org, roles: claims.roles ?? [] };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
