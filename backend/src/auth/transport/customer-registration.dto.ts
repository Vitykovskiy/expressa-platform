import { ApiProperty } from "@nestjs/swagger";

export class CompleteCustomerRegistrationDto {
  @ApiProperty({ minLength: 1 })
  name!: string;
}
