import * as Sentry from '@sentry/nestjs';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '20mb' })); // payload benchmark 100k user ~5 MB

  Sentry.init({
    dsn: process.env.DSN_SENTRY,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV || 'development',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.enableCors();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('tech-sharing API')
    .setDescription('This is description of the tech-sharing API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const OpenApiSpecification = apiReference({
    title: 'tech-sharing API',
    theme: 'default',
    content: document,
  });

  app.use('/api/iqro', OpenApiSpecification);

  await app.listen(3000);
}
bootstrap();
