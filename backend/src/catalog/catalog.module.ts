import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { PostgresPublicMenuRepository } from './adapters/postgres-public-menu.repository';
import { GetPublicMenuUseCase } from './application/get-public-menu.use-case';
import type { PublicMenuRepository } from './application/public-menu.repository.types';
import { publicMenuRepositoryPort } from './catalog.module.constants';
import { PublicMenuController } from './transport/public-menu.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicMenuController],
  providers: [
    {
      provide: publicMenuRepositoryPort,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) =>
        new PostgresPublicMenuRepository(createPoolProxy(database)),
    },
    {
      provide: GetPublicMenuUseCase,
      inject: [publicMenuRepositoryPort],
      useFactory: (repository: PublicMenuRepository) => new GetPublicMenuUseCase(repository),
    },
  ],
})
export class CatalogModule {}

function createPoolProxy(database: DatabaseService): Pool {
  return new Proxy({} as Pool, {
    get: (_target, property) => {
      const value = database.connectionPool[property as keyof Pool];
      return typeof value === 'function' ? value.bind(database.connectionPool) : value;
    },
  });
}
