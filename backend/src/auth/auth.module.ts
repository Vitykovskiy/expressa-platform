import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'pg';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { getCorsOrigins } from '../platform/config/environment';
import { accessTokenAudience, accessTokenIssuer, accessTokenLifetimeMs } from './application/verify-otp.use-case.constants';
import { authCryptoPort } from './application/auth-crypto.constants';
import { clockPort } from './application/clock.constants';
import { GetCurrentUserUseCase } from './application/get-current-user.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { RefreshSessionUseCase } from './application/refresh-session.use-case';
import { RequestOtpUseCase } from './application/request-otp.use-case';
import { VerifyOtpUseCase } from './application/verify-otp.use-case';
import { DevelopmentOtpAdapter } from './adapters/development-otp.adapter';
import { NodeAuthCryptoAdapter } from './adapters/node-auth-crypto.adapter';
import { PostgresAuthRepository } from './adapters/postgres-auth.repository';
import { SecureOtpCodeGenerator } from './adapters/secure-otp-code.generator';
import { SmsRuSmsSender } from './adapters/sms-ru-sms.sender';
import { SystemClockAdapter } from './adapters/system-clock.adapter';
import {
  authRepositoryPort,
  originGuardConfigurationToken,
  otpCodeGeneratorPort,
  sessionGuardConfigurationToken,
  smsSenderPort,
} from './auth.constants';
import type { AuthModuleConfiguration } from './auth.module.types';
import { AuthController } from './transport/auth.controller';
import { MeController } from './transport/me.controller';
import { OriginGuard } from './transport/origin.guard';
import { RolesGuard } from './transport/roles.guard';
import { SessionGuard } from './transport/session.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, MeController],
  providers: [
    {
      provide: authRepositoryPort,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new PostgresAuthRepository(createPoolProxy(database)),
    },
    {
      provide: authCryptoPort,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService) => {
        const auth = getAuthConfiguration(configuration);
        return new NodeAuthCryptoAdapter({ jwtSecret: auth.jwtSecret, otpPepper: auth.otpPepper });
      },
    },
    { provide: clockPort, useFactory: () => new SystemClockAdapter() },
    {
      provide: otpCodeGeneratorPort,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService) => createOtpCodeGenerator(getAuthConfiguration(configuration)),
    },
    {
      provide: smsSenderPort,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService) => createSmsSender(getAuthConfiguration(configuration)),
    },
    {
      provide: RequestOtpUseCase,
      inject: [authRepositoryPort, otpCodeGeneratorPort, authCryptoPort, smsSenderPort, clockPort],
      useFactory: (repository, codeGenerator, crypto, smsSender, clock) =>
        new RequestOtpUseCase(repository, codeGenerator, crypto, smsSender, clock),
    },
    {
      provide: VerifyOtpUseCase,
      inject: [authRepositoryPort, authCryptoPort, clockPort],
      useFactory: (repository, crypto, clock) => new VerifyOtpUseCase(repository, crypto, clock),
    },
    {
      provide: RefreshSessionUseCase,
      inject: [authRepositoryPort, authCryptoPort, clockPort],
      useFactory: (repository, crypto, clock) =>
        new RefreshSessionUseCase(repository, crypto, clock, {
          accessTokenAudience,
          accessTokenIssuer,
          accessTokenTtlMs: accessTokenLifetimeMs,
        }),
    },
    {
      provide: LogoutUseCase,
      inject: [authRepositoryPort, authCryptoPort, clockPort],
      useFactory: (repository, crypto, clock) => new LogoutUseCase(repository, crypto, clock),
    },
    {
      provide: GetCurrentUserUseCase,
      inject: [authRepositoryPort, authCryptoPort, clockPort],
      useFactory: (repository, crypto, clock) =>
        new GetCurrentUserUseCase(repository, crypto, clock, {
          accessTokenAudience,
          accessTokenIssuer,
        }),
    },
    {
      provide: originGuardConfigurationToken,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService) =>
        ({ allowedOrigins: getAuthConfiguration(configuration).allowedOrigins }),
    },
    {
      provide: sessionGuardConfigurationToken,
      useFactory: () => ({ accessTokenAudience, accessTokenIssuer }),
    },
    OriginGuard,
    SessionGuard,
    RolesGuard,
  ],
  exports: [
    authRepositoryPort,
    authCryptoPort,
    clockPort,
    sessionGuardConfigurationToken,
    SessionGuard,
    RolesGuard,
  ],
})
export class AuthModule {}

function createOtpCodeGenerator(configuration: AuthModuleConfiguration) {
  if (configuration.environment === 'local' || configuration.environment === 'development') {
    return new DevelopmentOtpAdapter(configuration.environment, configuration.developmentOtp);
  }

  return new SecureOtpCodeGenerator();
}

function createSmsSender(configuration: AuthModuleConfiguration) {
  if (configuration.environment === 'local' || configuration.environment === 'development') {
    return new DevelopmentOtpAdapter(configuration.environment, configuration.developmentOtp);
  }

  return new SmsRuSmsSender({ apiId: requireConfigurationValue(configuration.smsRuApiId, 'SMS_RU_API_ID'), from: requireConfigurationValue(configuration.smsRuSender, 'SMS_RU_SENDER') });
}

function getAuthConfiguration(configuration: ConfigService): AuthModuleConfiguration {
  const environment = requireConfigurationValue(configuration.get<string>('NODE_ENV'), 'NODE_ENV');
  if (!isDeliveryEnvironment(environment)) {
    throw new Error('Invalid environment variable: NODE_ENV');
  }

  return {
    allowedOrigins: getCorsOrigins({ CORS_ORIGINS: configuration.get<string>('CORS_ORIGINS') }),
    developmentOtp: configuration.get<string>('AUTH_DEVELOPMENT_OTP'),
    environment,
    jwtSecret: requireConfigurationValue(configuration.get<string>('AUTH_ACCESS_TOKEN_SECRET'), 'AUTH_ACCESS_TOKEN_SECRET'),
    otpPepper: requireConfigurationValue(configuration.get<string>('AUTH_OTP_PEPPER'), 'AUTH_OTP_PEPPER'),
    smsRuApiId: configuration.get<string>('SMS_RU_API_ID'),
    smsRuSender: configuration.get<string>('SMS_RU_SENDER'),
  };
}

function isDeliveryEnvironment(value: string): value is AuthModuleConfiguration['environment'] {
  return value === 'local' || value === 'development' || value === 'staging' || value === 'production';
}

function requireConfigurationValue(value: string | undefined, name: string): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Invalid environment variable: ${name}`);
  }

  return value;
}

function createPoolProxy(database: DatabaseService): Pool {
  return new Proxy({} as Pool, {
    get: (_target, property) => {
      const value = database.connectionPool[property as keyof Pool];
      return typeof value === 'function' ? value.bind(database.connectionPool) : value;
    },
  });
}
