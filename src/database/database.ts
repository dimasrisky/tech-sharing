import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from 'src/config/config.module';
import { DataSource, DataSourceOptions } from 'typeorm';

async function getConfigService() {
  const app = await NestFactory.createApplicationContext(ConfigModule);
  return app.get(ConfigService);
}

/*
It will be used for app connection to Database.
*/
export async function typeOrmConfig(): Promise<DataSourceOptions> {
  const configService = await getConfigService();
  return {
    type: 'postgres',
    synchronize: false,
    entities: ['dist/bases/**/*.entity{.ts,.js}', 'dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/database/migrations/*{.ts,.js}'],
    // cache: true,
    logging: false,
    replication: {
      master: {
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
      },
      slaves: [
        // {
        //   host: 'server2',
        //   port: 3306,
        //   username: 'test',
        //   password: 'test',
        //   database: 'test',
        // },
        // {
        //   host: 'server3',
        //   port: 3306,
        //   username: 'test',
        //   password: 'test',
        //   database: 'test',
        // },
      ],
    },
  };
}

async function getDataSource() {
  const dataSourceOption = await typeOrmConfig();
  return new DataSource(dataSourceOption);
}

/*
It will be used for Database migration.
*/
export const dataSource = getDataSource().then();
