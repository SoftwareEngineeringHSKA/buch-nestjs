import {NestFactory} from '@nestjs/core';
import helmet from 'helmet';

import {AppModule} from './app.module';
import {DbService} from './db/db.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  await app.listen(3000);
  const dbService = app.get(DbService);
  dbService.populateDB();
}
bootstrap();
