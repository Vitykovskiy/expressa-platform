import {
  PickupSlotResponseDto,
  OrderRejectionResponseDto,
} from "./order-metadata.dto";
import type { OrderQueueView } from "../domain/order-metadata.types";
import { ApiProperty } from "@nestjs/swagger";
import {
  BackofficeOrderCustomerResponseDto,
  BackofficeOrderEventResponseDto,
} from "./backoffice-orders.dto";
import { OrderV3ItemResponseDto } from "./order-v3.dto";
import type {
  BackofficeOrderV3Dto,
  BackofficeOrdersV3QueryDto as BackofficeOrdersV3Query,
} from "./backoffice-orders-v3.dto.types";

export class BackofficeOrdersV3QueryDto implements BackofficeOrdersV3Query {
  @ApiProperty({
    required: false,
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  stage?: "CREATED" | "ACCEPTED" | "PREPARING" | "READY" | "ISSUED";
  @ApiProperty({ required: false }) number?: string;
  @ApiProperty({ required: false, enum: ["all", "new", "confirmed", "ready"] })
  view?: OrderQueueView;
}

export class BackofficeOrderV3CustomerResponseDto extends BackofficeOrderCustomerResponseDto {
  @ApiProperty({ type: String, nullable: true }) name!: string | null;
}
export class SourceOrderRejectDto {
  @ApiProperty({ minLength: 1 }) reason!: string;
}
export class SourceOrderReadyDto {}
export class BackofficeOrderV3ResponseDto implements BackofficeOrderV3Dto {
  @ApiProperty() id!: string;
  @ApiProperty() number!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() total!: number;
  @ApiProperty({
    enum: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
  })
  stage!: string;
  @ApiProperty({ nullable: true, type: () => PickupSlotResponseDto })
  pickupSlot!: PickupSlotResponseDto | null;
  @ApiProperty({ nullable: true, type: () => OrderRejectionResponseDto })
  rejection!: OrderRejectionResponseDto | null;
  @ApiProperty({ type: () => BackofficeOrderV3CustomerResponseDto })
  customer!: BackofficeOrderV3CustomerResponseDto;
  @ApiProperty({ isArray: true, type: () => OrderV3ItemResponseDto })
  snapshot!: import("./order-v3.dto.types").OrderV3ItemDto[];
  @ApiProperty({ isArray: true, type: () => BackofficeOrderEventResponseDto })
  events!: BackofficeOrderEventResponseDto[];
}
