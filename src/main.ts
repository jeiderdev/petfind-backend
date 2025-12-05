import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;
  if (isNaN(port)) {
    throw new Error('PORT environment variable must be a number');
  }
  let globalPrefix = process.env.GLOBAL_PREFIX || '';
  if (globalPrefix && globalPrefix.length > 0) {
    if (globalPrefix.endsWith('/')) {
      globalPrefix = globalPrefix.slice(0, -1);
    }
    if (!globalPrefix.startsWith('/')) {
      globalPrefix = '/' + globalPrefix;
    }
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // 'api' is the path for Swagger UI
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: ${await app.getUrl()}${globalPrefix}`,
  );
  console.log(`Swagger UI is available at: ${await app.getUrl()}/api`);
}

bootstrap();
