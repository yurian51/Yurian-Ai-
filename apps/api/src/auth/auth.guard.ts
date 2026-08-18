import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from './auth.types';

export type AuthenticatedRequest = Request & { user: AuthenticatedPrincipal };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();

    const token = header.slice(7);
    try {
      request.user = await this.jwt.verifyAsync<AuthenticatedPrincipal>(token);
      return Boolean(request.user.userId && request.user.sessionId && request.user.organizationId);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
