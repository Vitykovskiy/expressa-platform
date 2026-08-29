import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { rolesMetadataKey } from '../../auth/transport/roles.decorator.constants';
import { RolesGuard } from '../../auth/transport/roles.guard';
import { SessionGuard } from '../../auth/transport/session.guard';
import { GetAdminCatalogUseCase } from '../application/get-admin-catalog.use-case';
import { ManageAvailabilityUseCase } from '../application/manage-availability.use-case';
import { ManageServiceIntakeUseCase } from '../application/manage-service-intake.use-case';
import { BackofficeAvailabilityController } from './backoffice-availability.controller';

describe('BackofficeAvailabilityController', () => {
  const auth = { userId: 'staff', sessionId: 'session', phoneE164: '+79991234567', role: 'barista' as const };
  const request = { requestId: 'request' };

  it('передаёт availability и intake staff-команды', async () => {
    const catalog = { categories: [], products: [], productVariants: [], modifierGroups: [], modifierOptions: [], categoryModifierGroups: [], intake: { acceptsNewOrders: true, updatedBy: null, updatedByLabel: null, updatedAt: null } };
    const get = { execute: jest.fn().mockResolvedValue(catalog) };
    const availability = { execute: jest.fn().mockResolvedValue({ type: 'variant', id: 'c9d39eaa-2d6d-4ae1-b69c-5205778ea4bd', isAvailable: false }) };
    const intake = { execute: jest.fn().mockResolvedValue({ acceptsNewOrders: false, updatedBy: 'staff', updatedByLabel: '+79991234567', updatedAt: new Date('2030-01-01T00:00:00.000Z') }) };
    const controller = new BackofficeAvailabilityController(get as unknown as GetAdminCatalogUseCase, availability as unknown as ManageAvailabilityUseCase, intake as unknown as ManageServiceIntakeUseCase);

    await expect(controller.getAvailability()).resolves.toEqual(catalog);
    await expect(controller.updateAvailability('variant', 'c9d39eaa-2d6d-4ae1-b69c-5205778ea4bd', { isAvailable: false }, auth, request)).resolves.toMatchObject({ isAvailable: false });
    await expect(controller.updateIntake({ acceptsNewOrders: false }, auth, request)).resolves.toMatchObject({ acceptsNewOrders: false });
    expect(availability.execute).toHaveBeenCalledWith({ type: 'variant', id: 'c9d39eaa-2d6d-4ae1-b69c-5205778ea4bd', isAvailable: false, actorId: 'staff', requestId: 'request' });
    expect(intake.execute).toHaveBeenCalledWith({ acceptsNewOrders: false, actorId: 'staff', requestId: 'request' });
  });

  it('валидирует команду до use case', async () => {
    const controller = new BackofficeAvailabilityController({ execute: jest.fn() } as unknown as GetAdminCatalogUseCase, { execute: jest.fn() } as unknown as ManageAvailabilityUseCase, { execute: jest.fn() } as unknown as ManageServiceIntakeUseCase);
    await expect(controller.updateAvailability('unknown' as never, 'id', { isAvailable: true }, auth, request)).rejects.toMatchObject({ status: 400 });
  });

  it('регистрирует staff routes', () => {
    const prototype = BackofficeAvailabilityController.prototype;
    expect(Reflect.getMetadata(PATH_METADATA, BackofficeAvailabilityController)).toBe('backoffice');
    expect(Reflect.getMetadata(GUARDS_METADATA, BackofficeAvailabilityController)).toEqual([SessionGuard, RolesGuard]);
    expect(Reflect.getMetadata(rolesMetadataKey, BackofficeAvailabilityController)).toBe('Staff');
    expect(Reflect.getMetadata(PATH_METADATA, prototype.getAvailability)).toBe('availability');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.updateAvailability)).toBe(RequestMethod.PATCH);
  });
});
