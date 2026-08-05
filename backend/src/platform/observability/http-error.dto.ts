import { ApiProperty } from '@nestjs/swagger';
import type {
  ApiErrorDetails,
  ApiValidationErrorDetails,
  ApiValidationField,
} from './http-error.dto.types';

export class ApiHttpErrorDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ additionalProperties: true, nullable: true, type: 'object' })
  details!: ApiErrorDetails;

  @ApiProperty()
  requestId!: string;
}

export class ApiValidationFieldDto implements ApiValidationField {
  @ApiProperty()
  path!: string;

  @ApiProperty()
  reason!: string;
}

export class ApiValidationErrorDetailsDto implements ApiValidationErrorDetails {
  @ApiProperty({ isArray: true, type: () => ApiValidationFieldDto })
  fields!: ApiValidationFieldDto[];
}

export class ApiValidationErrorDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: () => ApiValidationErrorDetailsDto })
  details!: ApiValidationErrorDetails;

  @ApiProperty()
  requestId!: string;
}
