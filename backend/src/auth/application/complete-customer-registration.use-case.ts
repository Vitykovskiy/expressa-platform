import { AccessDeniedError } from "../domain/auth.errors";
import type { Clock } from "./clock.types";
import type {
  CustomerRegistrationRepository,
  RegisteredAuthUser,
} from "./customer-registration.repository.types";
import type { CompleteCustomerRegistrationInput } from "./complete-customer-registration.use-case.types";
import { GetCurrentUserUseCase } from "./get-current-user.use-case";

export class CompleteCustomerRegistrationUseCase {
  constructor(
    private readonly identities: GetCurrentUserUseCase,
    private readonly repository: CustomerRegistrationRepository,
    private readonly clock: Clock,
  ) {}

  async currentUser(
    accessToken: string,
    sessionId: string,
  ): Promise<RegisteredAuthUser> {
    const identity = await this.identities.execute(accessToken);
    // Базовая идентичность OTP/refresh не включает профиль. Отдельное чтение
    // добавляет имя и заново подтверждает активность той же сессии.
    const user = await this.repository.findCurrentUser(
      sessionId,
      this.clock.now(),
    );
    if (user === null || user.id !== identity.id) {
      throw new AccessDeniedError();
    }

    return user;
  }

  complete(
    input: CompleteCustomerRegistrationInput,
  ): Promise<RegisteredAuthUser> {
    return this.repository.complete({ ...input, now: this.clock.now() });
  }
}
