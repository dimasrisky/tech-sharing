import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DataSource,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Injectable()
export class BaseRepository<
  TEntity extends BaseEntity,
> extends Repository<TEntity> {
  constructor(
    private readonly entity: new () => TEntity,
    dataSource: DataSource,
  ) {
    super(entity, dataSource.createEntityManager());
  }

  async firstWhere(
    column: string,
    value: string | number,
    operator = '=',
  ): Promise<TEntity | null> {
    return await this.createQueryBuilder()
      .where(this.entity.name + '.' + column + operator + ' :value', {
        value,
      })
      .getOne();
  }

  async findByIdsFail(
    ids: string[],
    relations: string[] = [],
  ): Promise<TEntity[]> {
    const instances = await this.find({
      where: { id: In(ids) } as FindOptionsWhere<TEntity>,
      relations: relations as unknown as FindOptionsRelations<TEntity>,
    });

    const foundIds = instances.map((instance: TEntity) => instance.id);
    const notFoundIds = ids.filter((id) => !foundIds.includes(parseInt(id)));

    if (notFoundIds.length > 0) {
      throw new NotFoundException(
        this.entity.name + ' IDs not found: ' + notFoundIds.join(', '),
      );
    }

    return instances;
  }
}
