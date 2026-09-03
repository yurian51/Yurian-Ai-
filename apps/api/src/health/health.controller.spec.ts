import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { prisma } from '@yurian/database';

jest.mock('@yurian/database', () => ({
  prisma: { $queryRaw: jest.fn() },
}));

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = module.get(HealthController);
    jest.clearAllMocks();
  });

  it('reports liveness', () => {
    expect(controller.health().status).toBe('ok');
  });

  it('reports readiness when PostgreSQL is reachable', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.ready()).resolves.toMatchObject({
      status: 'ready',
      dependencies: { postgres: 'ok' },
    });
  });

  it('fails readiness when PostgreSQL is unavailable', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('db unavailable'));
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
