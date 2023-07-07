import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get('JWT_SECRET_KEY'),
          global: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class CoreModule {}
