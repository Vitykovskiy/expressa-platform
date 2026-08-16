import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Inject, Put, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentAuth } from '../../auth/transport/current-auth.decorator';
import type { CurrentAuth as CurrentAuthData } from '../../auth/transport/current-auth.decorator.types';
import { RolesGuard } from '../../auth/transport/roles.guard';
import { SessionGuard } from '../../auth/transport/session.guard';
import { ApiHttpErrorDto } from '../../platform/observability/http-error.dto';
import { ManagePushSubscriptionUseCase } from '../application/manage-push-subscription.use-case';
import { PushPublicKeyDto, PushSubscriptionDto } from './push-subscriptions.dto';
import type { PushPublicKeyDto as PushPublicKeyResponse, PushSubscriptionDto as PushSubscriptionRequest } from './push-subscriptions.dto.types';

@ApiTags('Push')
@Controller('push')
@UseGuards(SessionGuard, RolesGuard)
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
export class PushSubscriptionsController {
  constructor(private readonly subscriptions: ManagePushSubscriptionUseCase, @Inject(ConfigService) private readonly configuration: ConfigService) {}

  @Get('public-key')
  @ApiOperation({ summary: 'Получить публичный VAPID ключ' })
  @ApiResponse({ status: HttpStatus.OK, type: PushPublicKeyDto })
  publicKey(): PushPublicKeyResponse { return { publicKey: this.configuration.getOrThrow<string>('VAPID_PUBLIC_KEY') }; }

  @Delete('subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить свою push-подписку' })
  @ApiBody({ type: PushSubscriptionDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  async delete(@Body() body: unknown, @CurrentAuth() auth: CurrentAuthData): Promise<void> {
    const endpoint = parseEndpoint(body);
    await this.subscriptions.delete(auth.userId, endpoint);
  }

  @ApiOperation({ summary: 'Сохранить свою push-подписку' })
  @ApiBody({ type: PushSubscriptionDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiHttpErrorDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('subscriptions')
  async upsert(@Body() body: unknown, @CurrentAuth() auth: CurrentAuthData): Promise<void> {
    const subscription = parseSubscription(body);
    await this.subscriptions.upsert({ userId: auth.userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth });
  }
}

function parseEndpoint(value: unknown): string { return parseSubscription(value).endpoint; }
function parseSubscription(value: unknown): PushSubscriptionRequest {
  if (typeof value !== 'object' || value === null || !('endpoint' in value) || !('keys' in value) || typeof value.endpoint !== 'string' || !isUrl(value.endpoint) || typeof value.keys !== 'object' || value.keys === null || !('p256dh' in value.keys) || !('auth' in value.keys) || typeof value.keys.p256dh !== 'string' || typeof value.keys.auth !== 'string' || value.keys.p256dh.trim() === '' || value.keys.auth.trim() === '') validationError();
  return value as PushSubscriptionRequest;
}
function isUrl(value: string): boolean { try { return new URL(value).protocol === 'https:'; } catch { return false; } }
function validationError(): never { throw new HttpException({ code: 'VALIDATION_ERROR', message: 'Параметры запроса недопустимы.', details: null }, HttpStatus.BAD_REQUEST); }
