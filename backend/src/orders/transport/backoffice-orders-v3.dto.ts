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
}

export class BackofficeOrderV3ResponseDto implements BackofficeOrderV3Dto {
  @ApiProperty() id!: string;
  @ApiProperty() number!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() total!: number;
  @ApiProperty() stage!: string;
  @ApiProperty({ type: () => BackofficeOrderCustomerResponseDto })
  customer!: BackofficeOrderCustomerResponseDto;
  @ApiProperty({ isArray: true, type: () => OrderV3ItemResponseDto })
  snapshot!: import("./order-v3.dto.types").OrderV3ItemDto[];
  @ApiProperty({ isArray: true, type: () => BackofficeOrderEventResponseDto })
  events!: BackofficeOrderEventResponseDto[];
}
