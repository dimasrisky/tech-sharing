import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { performance } from 'node:perf_hooks';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './dto/bulk-users.dto';
import { User } from './user.entity';

export interface BenchmarkResult {
  approach: string;
  totalInserted: number;
  executionTime: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // Pendekatan 1: Naive Looping — 1 INSERT per user (N round-trip ke DB).
  async naiveLoop(users: CreateUserDto[]): Promise<BenchmarkResult> {
    const start = performance.now();

    for (const user of users) {
      await this.usersRepository.insert(user);
    }

    return this.result('Regular Loop', users.length, start);
  }

  // Pendekatan 2: Single Bulk Insert — 1 SQL multi-row (1 round-trip).
  async singleBulk(users: CreateUserDto[]): Promise<BenchmarkResult> {
    const start = performance.now();

    try {
      await this.usersRepository
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(users)
        .execute();
    } catch (error) {
      this.logger.error(`singleBulk gagal (${users.length} baris)`, error);
      throw error;
    }

    return this.result('Bulk Insert', users.length, start);
  }

  // Pendekatan 3: Batch/Chunked Bulk Insert dalam 1 transaksi (ceil(N/chunk) round-trip, atomik).
  async batchChunk(
    users: CreateUserDto[],
    chunkSize = 200,
  ): Promise<BenchmarkResult> {
    if (chunkSize < 1) {
      throw new BadRequestException('chunkSize harus >= 1');
    }
    const start = performance.now();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(User)
          .values(chunk)
          .execute();
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `batchChunk gagal (${users.length} baris, chunk ${chunkSize})`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.result('Batch Chunk', users.length, start);
  }

  private result(
    approach: string,
    total: number,
    start: number,
  ): BenchmarkResult {
    return {
      approach,
      totalInserted: total,
      executionTime: `${(performance.now() - start).toFixed(2)} ms`,
    };
  }
}
