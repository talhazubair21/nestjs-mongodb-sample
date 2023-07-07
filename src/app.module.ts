import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BudgetModule } from './modules/budget/budget.module';
import { CoreModule } from './modules/core/core.module';
import { config } from './config';
import { APILoggingMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      // envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('API.THROTTLE_TTL'),
        limit: config.get('API.THROTTLE_LIMIT'),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('MONGODB.CONNECTION_STRING'),
      }),
    }),
    CacheModule.register(),
    CoreModule,
    AuthModule,
    UserModule,
    BudgetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(APILoggingMiddleware).forRoutes('*'); // Register the middleware for all routes
    // Or specify specific routes:
    // consumer.apply(LoggingMiddleware).forRoutes('users', 'products');
  }
}
