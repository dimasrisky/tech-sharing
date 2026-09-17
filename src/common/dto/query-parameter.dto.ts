import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class QueryParameterDto extends PaginationDto {
  @IsString()
  @IsOptional()
  @Matches(
    /^[a-zA-Z_][a-zA-Z0-9_]*:(ASC|DESC)(?:,[a-zA-Z_][a-zA-Z0-9_]*:(ASC|DESC))*$/,
    {
      message: 'Order by format is invalid. Use "field:ASC" or "field:DESC".',
    },
  )
  @ApiPropertyOptional({
    description:
      'Order by field(s) in format "field:direction". Multiple fields can be separated by comma.',
    example: 'id:DESC,createdAt:ASC',
    pattern:
      '^[a-zA-Z_][a-zA-Z0-9_]*:(ASC|DESC)(?:,[a-zA-Z_][a-zA-Z0-9_]*:(ASC|DESC))*$',
  })
  orderBy?: string;

  @IsString({
    message: 'Search Query Harus String',
  })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search query string',
    required: false,
  })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Enable pagination',
    default: true,
  })
  isPaginate?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Include soft-deleted records',
    default: false,
  })
  withDeleted?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Only include soft-deleted records',
    default: false,
  })
  onlyDeleted?: boolean;
}
