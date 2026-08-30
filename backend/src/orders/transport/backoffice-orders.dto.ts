import { ApiProperty } from "@nestjs/swagger";
import type {
  BackofficeOrderDetailsDto,
  BackofficeOrderEventDto,
  BackofficeOrderListItemDto,
} from "./backoffice-orders.dto.types";
import { OrderItemResponseDto } from "./order.dto";

export class BackofficeOrderEventResponseDto implements BackofficeOrderEventDto {
  @ApiProperty({ format: "uuid" }) actorId!: string;
  @ApiProperty({ pattern: "^\\+[1-9]\\d{1,14}$", example: "+79991234567" })
  actorLabel!: string;
  @ApiProperty({ format: "date-time" }) occurredAt!: string;
  @ApiProperty({
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  from!: "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
  @ApiProperty({
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  to!: "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
}

export class BackofficeOrderCustomerResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ example: "+79991234567" }) phoneE164!: string;
}

export class BackofficeOrderListItemResponseDto implements BackofficeOrderListItemDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ example: "20300102-001" }) number!: string;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "int32", minimum: 0, type: "integer" }) total!: number;
  @ApiProperty({
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  stage!: "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
}

export class BackofficeOrderDetailsResponseDto
  extends BackofficeOrderListItemResponseDto
  implements BackofficeOrderDetailsDto
{
  @ApiProperty({ type: () => BackofficeOrderCustomerResponseDto })
  customer!: BackofficeOrderCustomerResponseDto;
  @ApiProperty({ isArray: true, type: () => OrderItemResponseDto })
  snapshot!: OrderItemResponseDto[];
  @ApiProperty({ isArray: true, type: () => BackofficeOrderEventResponseDto })
  events!: BackofficeOrderEventResponseDto[];
}
