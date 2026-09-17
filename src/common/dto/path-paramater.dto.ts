import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class PathParameterDto {
  @IsUUID()
  @Type(() => String)
  @ApiProperty()
  id: string;
}
