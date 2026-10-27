import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";
import { ManageStaffUsersUseCase } from "../application/manage-staff-users.use-case";
import { CustomersResponseDto } from "./membership.dto";
import { parseCustomersQuery } from "./staff-users.validation";

@ApiTags("backoffice-customers")
@Controller("api/v3/backoffice/customers")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: 400, type: ApiHttpErrorDto })
@ApiResponse({ status: 401, type: ApiHttpErrorDto })
@ApiResponse({ status: 403, type: ApiHttpErrorDto })
@ApiResponse({ status: 500, type: ApiHttpErrorDto })
export class CustomersController {
  constructor(private readonly users: ManageStaffUsersUseCase) {}
  @Get()
  @ApiOperation({
    summary: "Список зарегистрированных клиентов",
    description:
      "Administrator; literal name/phone search, strict single search query. Ordered by name NULLS LAST, phoneE164, id. No staff role/access/action fields.",
  })
  @ApiQuery({ name: "search", type: String, required: false })
  @ApiResponse({ status: 200, type: CustomersResponseDto })
  async list(@Query() query: unknown): Promise<CustomersResponseDto> {
    return {
      customers: (
        await this.users.listCustomers(parseCustomersQuery(query).search)
      ).map((customer) => ({
        ...customer,
        registeredAt: customer.registeredAt.toISOString(),
      })),
    };
  }
}
