import { Injectable } from '@nestjs/common';
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

const CHUNK_SIZE = 200;

@Injectable()
export class UsersService {
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

    await this.usersRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(users)
      .execute();

    return this.result('Bulk Insert', users.length, start);
  }

  // Pendekatan 3: Batch/Chunked Bulk Insert dalam 1 transaksi (ceil(N/chunk) round-trip, atomik).
  async batchChunk(users: CreateUserDto[]): Promise<BenchmarkResult> {
    const start = performance.now();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        const chunk = users.slice(i, i + CHUNK_SIZE);
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
