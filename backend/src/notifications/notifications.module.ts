import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'pg';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { PostgresPushSubscriptionRepository } from './adapters/postgres-push-subscription.repository';
import { WebPushSender } from './adapters/web-push.sender';
import { ManagePushSubscriptionUseCase } from './application/manage-push-subscription.use-case';
import { SendOrderPushUseCase } from './application/send-order-push.use-case';
import type { PushSender, PushSubscriptionRepository } from './application/push-notifications.types';
import { PushSubscriptionsController } from './transport/push-subscriptions.controller';

export const pushSubscriptionRepositoryPort = Symbol('pushSubscriptionRepositoryPort');
export const pushSenderPort = Symbol('pushSenderPort');

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PushSubscriptionsController],
  providers: [
    { provide: PostgresPushSubscriptionRepository, inject: [DatabaseService], useFactory: (database: DatabaseService) => new PostgresPushSubscriptionRepository({ pool: createPoolProxy(database) }) },
    { provide: pushSubscriptionRepositoryPort, inject: [PostgresPushSubscriptionRepository], useFactory: (repository: PostgresPushSubscriptionRepository) => repository },
    { provide: pushSenderPort, inject: [ConfigService], useFactory: (configuration: ConfigService) => new WebPushSender({ subject: configuration.getOrThrow<string>('VAPID_SUBJECT'), publicKey: configuration.getOrThrow<string>('VAPID_PUBLIC_KEY'), privateKey: configuration.getOrThrow<string>('VAPID_PRIVATE_KEY') }) },
    { provide: ManagePushSubscriptionUseCase, inject: [pushSubscriptionRepositoryPort], useFactory: (repository: PushSubscriptionRepository) => new ManagePushSubscriptionUseCase(repository) },
    { provide: SendOrderPushUseCase, inject: [pushSubscriptionRepositoryPort, pushSenderPort], useFactory: (repository: PushSubscriptionRepository, sender: PushSender) => new SendOrderPushUseCase(repository, sender) },
  ],
  exports: [SendOrderPushUseCase],
})
export class NotificationsModule {}

function createPoolProxy(database: DatabaseService): Pool {
  return new Proxy({} as Pool, { get: (_target, property) => { const value = database.connectionPool[property as keyof Pool]; return typeof value === 'function' ? value.bind(database.connectionPool) : value; } });
}
