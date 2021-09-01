import {NestFactory} from '@nestjs/core';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import helmet from 'helmet';

import {AppModule} from './app.module';
import {DbService} from './db/db.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
                     .setTitle('Buecher Beispiel')
                     .setDescription('The cats API description')
                     .setVersion('1.0')
                     .addTag('buecher')
                     .addBasicAuth()
                     .addBearerAuth()
                     .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  app.use(helmet());
  await app.listen(3000);
  const dbService = app.get(DbService);
  dbService.populateDB();
}
bootstrap();
