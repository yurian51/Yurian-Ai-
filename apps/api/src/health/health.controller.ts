import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('system')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API health check' })
  health() {
    return {
      status: 'ok',
      service: 'yurian-ai-os-api',
      timestamp: new Date().toISOString(),
    };
  }
}
