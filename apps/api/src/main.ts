import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter, hardeningMiddleware } from './platform/http-hardening';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const allowedOrigins = new Set((process.env.CORS_ORIGINS ?? 'http://localhost:3001,http://localhost:3002').split(',').map((x) => x.trim()).filter(Boolean));
  app.use(hardeningMiddleware(allowedOrigins));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.enableCors({ origin: [...allowedOrigins], credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Authorization','Content-Type','X-Correlation-ID','X-Razorpay-Signature','X-Razorpay-Event-Id'] });
  const config = new DocumentBuilder().setTitle('WedConnect API').setDescription('Versioned API for the WedConnect discovery and introduction platform').setVersion('1.0').build();
  if (process.env.NODE_ENV !== 'production') SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(Number(process.env.PORT ?? process.env.API_PORT ?? 4000), '0.0.0.0');
}
void bootstrap();
