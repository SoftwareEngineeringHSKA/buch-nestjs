import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    #logger = new Logger(LoggerMiddleware.name);
    use(req: Request, res: Response, next: NextFunction) {
        this.#logger.log('Request URL: ', req.url);
        this.#logger.log('Response: HEADER ', res.header);
        next();
    }
}
