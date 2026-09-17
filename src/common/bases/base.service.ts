import {
  EntityNotFoundError,
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  QueryFailedError,
} from 'typeorm';
import { QueryParameterDto } from '../dto/query-parameter.dto';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';
import { BaseEntity } from './base.entity';
import { BaseRepository } from './base.repository';

import { InternalServerErrorException } from '@nestjs/common';
import { ConflictException } from './exceptions/templates/conflict.exception';
import { NotFoundException } from './exceptions/templates/not-found.exception';

export abstract class BaseService<
  TEntity extends BaseEntity,
  TCreate,
  TUpdate,
> {
  constructor(private readonly entitiesRepository: BaseRepository<TEntity>) {}

  protected paramBuilder(
    options?: QueryParameterDto,
  ): FindManyOptions<TEntity> {
    const {
      limit = 10,
      page = 1,
      orderBy = 'createdAt:DESC',
      isPaginate = true,
      withDeleted = false,
      onlyDeleted = false,
    } = options || {};

    // Handle multiple sort
    const order: FindOptionsOrder<TEntity> = {};

    const orders = orderBy?.split(',').map((item) => item.trim());

    orders?.forEach((item) => {
      const [field, direction] = item.split(':');
      if (field && direction) {
        const isFieldExist = this.entitiesRepository.metadata.columns.some(
          (column) => column.propertyName === field,
        );

        if (!isFieldExist) {
          throw new NotFoundException(
            `Field ${field} tidak ditemukan di ${this.entitiesRepository.metadata.name}`,
            field,
          );
        }

        order[field] = direction.toUpperCase() as 'ASC' | 'DESC';
      } else {
        order[field] = 'DESC';
      }
    });

    if (onlyDeleted) {
      // Include only soft-deleted records
      return {
        take: isPaginate ? limit : undefined,
        skip: isPaginate ? (page - 1) * limit : undefined,
        order: order,
        withDeleted: true,
      };
    }

    return {
      take: isPaginate ? limit : undefined,
      skip: isPaginate ? (page - 1) * limit : undefined,
      order: order,
      withDeleted,
      ...options,
    };
  }

  private handleError(error: unknown, action: string): void {
    console.error('Error during : ' + action, error);

    if (error instanceof QueryFailedError && 'code' in error) {
      const pgError = error as QueryFailedError & {
        code: string;
        detail?: string;
      };
      if (pgError.code === '23505') {
        const match = pgError.detail?.match(/\(([^)]+)\)/);
        const field = match ? match[1] : 'unknown field';
        throw new ConflictException(
          'Duplicate value for unique field: ' + field,
          field,
          'duplicateError',
        );
      }
    }

    throw new InternalServerErrorException(
      'Failed to ' +
        action +
        ': ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    );

    // Tangani error lain
  }

  async create(
    createDto: TCreate,
    user?: IJwtPayload,
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity> {
    repository = repository ? repository : this.entitiesRepository;

    try {
      const instance: Partial<TEntity> = { ...createDto } as Partial<TEntity>;

      instance.createdBy = user?.username;

      const createdEntity: TEntity = repository.create(instance as TEntity);
      return await repository.save(createdEntity);
    } catch (error) {
      this.handleError(error, 'create entity');
      throw error;
    }
  }

  async findAll(
    options?: FindManyOptions<TEntity>,
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity[]> {
    repository = repository ? repository : this.entitiesRepository;

    return await repository.find(options);
  }

  async findAndCount(
    queryParam: QueryParameterDto,
    options: FindManyOptions<TEntity> = {},
    repository?: BaseRepository<TEntity>,
  ): Promise<[TEntity[], number]> {
    const queryOptions = Object.keys(options || {}).length
      ? options
      : this.paramBuilder(queryParam);

    repository = repository ? repository : this.entitiesRepository;

    return await repository.findAndCount(queryOptions);
  }

  async findOneById(
    id: number | string,
    relations: FindOptionsRelations<TEntity> = {},
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity | null> {
    repository = repository ? repository : this.entitiesRepository;

    return await repository.findOne({
      where: { id } as FindOptionsWhere<TEntity>,
      relations,
    });
  }

  async findOneBy(
    options: FindOptionsWhere<TEntity>,
    relations?: FindOptionsRelations<TEntity>,
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity | null> {
    repository = repository ? repository : this.entitiesRepository;

    try {
      const instance = await repository.findOne({
        where: options,
        relations: relations,
      });

      return instance;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findOneByIdOrFail(
    id: number | string,
    relations: string[] = [],
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity> {
    repository = repository ?? this.entitiesRepository;

    try {
      const instance = await repository.findOneOrFail({
        where: { id } as FindOptionsWhere<TEntity>,
        relations: relations as unknown as FindOptionsRelations<TEntity>,
      });

      return instance;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(
          this.entitiesRepository.metadata.name +
            " with Property '" +
            id +
            "' not found",
          'id',
        );
      }
      throw error;
    }
  }

  async findOneByOrFail(
    options: FindOptionsWhere<TEntity>,
    relations?: FindOptionsRelations<TEntity>,
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity> {
    repository = repository ?? this.entitiesRepository;

    try {
      const instance = await repository.findOne({
        where: options,
        relations: relations,
      });
      if (!instance) {
        throw new NotFoundException(
          this.entitiesRepository.metadata.name +
            ' with Property ' +
            JSON.stringify(options) +
            ' not found',
          Object.keys(options).join(', ') || '',
        );
      }
      return instance;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async update(
    id: number | string,
    updateDto: TUpdate,
    user?: IJwtPayload,
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity> {
    repository = repository ?? this.entitiesRepository;

    const entity: TEntity | null = await this.findOneByIdOrFail(id);

    const updatedEntity: TEntity = {
      ...entity,
      ...updateDto,
      updatedBy: user?.username ?? entity.updatedBy,
    };

    return await repository.save(updatedEntity);
  }

  async softRemove(
    id: number | string,
    user?: IJwtPayload,
    repository?: BaseRepository<TEntity>,
  ): Promise<TEntity> {
    repository = repository ?? this.entitiesRepository;

    try {
      const entity = await this.findOneByIdOrFail(id);

      entity.deletedBy = user?.username;

      await repository.save(entity);

      return await repository.softRemove(entity);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
