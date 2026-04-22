import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();

  // Filtre d'exceptions global — uniformise toutes les erreurs HTTP en JSON
  app.useGlobalFilters(new HttpExceptionFilter());

  // Servir les fichiers uploadés en statique depuis /uploads
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expressApp.use('/uploads', require('express').static(join(process.cwd(), 'uploads')));

  // Sécurité : headers HTTP
  app.use(helmet());

  // Prefix global
  app.setGlobalPrefix('api');

  // Validation des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Sérialisation (exclure champs @Exclude)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}/api`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
