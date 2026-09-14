import { Body, Controller, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as Auth } from "../../auth/transport/current-auth.decorator.types";
import { ManageAvailabilityUseCase } from "../application/manage-availability.use-case";
import { V3AvailabilityDto } from "./backoffice-availability-v3.dto";
@ApiTags("availability-v3")
@Controller("api/v3/backoffice/availability")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Staff")
@ApiBearerAuth()
export class BackofficeAvailabilityV3Controller {
  constructor(private readonly availability: ManageAvailabilityUseCase) {}
  @Patch("price-choice/:id") async update(
    @Param("id") id: string,
    @Body() body: V3AvailabilityDto,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId: string },
  ) {
    return this.availability.execute({
      type: "price_choice",
      id,
      isAvailable: body.isAvailable,
      actorId: auth.userId,
      requestId: request.requestId,
    });
  }
}
