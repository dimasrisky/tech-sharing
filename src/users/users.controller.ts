import {
  Body,
  Controller,
  DefaultValuePipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BulkUsersDto } from './dto/bulk-users.dto';
import { BenchmarkResult, UsersService } from './users.service';

@ApiTags('Users Benchmark')
@Controller('users/benchmark')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('regular-loop')
  @ApiOperation({ summary: 'Insert 1-per-1 via for...of (N round-trip)' })
  naiveLoop(@Body() dto: BulkUsersDto): Promise<BenchmarkResult> {
    return this.usersService.naiveLoop(dto.users);
  }

  @Post('bulk-insert')
  @ApiOperation({ summary: 'Insert semua user dalam 1 SQL multi-row' })
  singleBulk(@Body() dto: BulkUsersDto): Promise<BenchmarkResult> {
    return this.usersService.singleBulk(dto.users);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Insert per chunk (default 200) dalam 1 transaksi' })
  @ApiQuery({ name: 'chunkSize', required: false, example: 200 })
  batchChunk(
    @Body() dto: BulkUsersDto,
    @Query('chunkSize', new DefaultValuePipe(200), ParseIntPipe)
    chunkSize: number,
  ): Promise<BenchmarkResult> {
    return this.usersService.batchChunk(dto.users, chunkSize);
  }
}
