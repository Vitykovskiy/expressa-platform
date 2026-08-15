import { MODULE_METADATA } from '@nestjs/common/constants';
import { NotificationsModule } from './notifications.module';

describe('NotificationsModule', () => {
  it('регистрирует transport и экспортирует отправку заказа', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, NotificationsModule)).toHaveLength(1);
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, NotificationsModule)).toHaveLength(1);
  });
});
