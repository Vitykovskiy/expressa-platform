import type { PushSubscriptionCommand, PushSubscriptionRepository } from './push-notifications.types';

export class ManagePushSubscriptionUseCase {
  constructor(private readonly repository: PushSubscriptionRepository) {}
  upsert(command: PushSubscriptionCommand): Promise<void> { return this.repository.upsert(command); }
  delete(userId: string, endpoint: string): Promise<void> { return this.repository.delete(userId, endpoint); }
}
