import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { prisma } from '@yurian/database';

@ApiTags('system')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API liveness check' })
  health() {
    return {
      status: 'ok',
      service: 'yurian-ai-os-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'API readiness and database check' })
  async ready() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        service: 'yurian-ai-os-api',
        dependencies: { postgres: 'ok' },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        service: 'yurian-ai-os-api',
        dependencies: { postgres: 'unavailable' },
      });
    }
  }
}
