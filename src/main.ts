import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = new ConfigService();

  app.enableCors();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.use(helmet());

  // Initialize Sentry by passing the DNS included in the .env
  Sentry.init({
    dsn: configService.get('SENTRY_DNS'),
    environment: configService.get('NODE_ENV'),
    integrations: [new Sentry.Integrations.Http({ tracing: true })],
    tracesSampleRate: 0.1,
  });
  /** Register sentry as an app middleware in order to collect any request made to the application before passing it onto the appropriate controller. */
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  /** Register sentry error handler before passing error onto the app's error handling function. */
  app.use(Sentry.Handlers.errorHandler());

  await app.listen(4000);
}
bootstrap();
