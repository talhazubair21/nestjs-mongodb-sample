import { Injectable, NestMiddleware, OnModuleInit } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as morgan from 'morgan';
import * as fs from 'fs';

@Injectable()
export class APILoggingMiddleware implements NestMiddleware, OnModuleInit {
  private logger: morgan.Morgan;
  private logSaver: morgan.Morgan;

  onModuleInit() {
    this.logger = morgan(':method :status :url :response-time ms - [:date]');
    this.logSaver = morgan(':method :status :url :response-time ms - [:date]', {
      stream: fs.createWriteStream('access.log', { flags: 'a' }),
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // morgan.token('logMessage', (req, res) => ''); // Define a custom token to capture the log message
    this.logger(req, res, (err) => {
      if (err) {
        return next(err);
      }
    });
    this.logSaver(req, res, (err) => {
      if (err) {
        return next(err);
      }
    });
    next();
  }
}
