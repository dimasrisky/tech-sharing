import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Insert per chunk @200 dalam 1 transaksi' })
  batchChunk(@Body() dto: BulkUsersDto): Promise<BenchmarkResult> {
    return this.usersService.batchChunk(dto.users);
  }
}
