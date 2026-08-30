import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetCurrentUserUseCase } from "../application/get-current-user.use-case";
import { CurrentAuth } from "./current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "./current-auth.decorator.types";
import { CurrentUserDto } from "./auth.dto";
import { SessionGuard } from "./session.guard";

@ApiTags("auth")
@Controller("me")
export class MeController {
  constructor(private readonly getCurrentUser: GetCurrentUserUseCase) {}

  @Get()
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить текущего пользователя" })
  @ApiResponse({ status: 200, type: CurrentUserDto })
  async currentUser(
    @Headers("authorization") authorization: string | undefined,
    @CurrentAuth() _auth: CurrentAuthData,
  ): Promise<CurrentUserDto> {
    void _auth;
    const accessToken = readBearerToken(authorization);
    if (accessToken === null) {
      throw new UnauthorizedException();
    }

    const user = await this.getCurrentUser.execute(accessToken);
    return { id: user.id, phoneE164: user.phoneE164, role: user.role };
  }
}

function readBearerToken(value: string | undefined): string | null {
  return value !== undefined && /^Bearer [^\s]+$/.test(value)
    ? value.slice("Bearer ".length)
    : null;
}
