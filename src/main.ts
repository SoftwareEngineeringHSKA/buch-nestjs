import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { DbService } from './db/db.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // SWAGGER
    const config = new DocumentBuilder()
        .setTitle('Buecher Beispiel')
        .setDescription('Eine beispielhafte NestJS Anwendung')
        .setVersion('1.0')
        .addTag('buecher')
        .addBasicAuth()
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'token',
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document);

    // HELMET
    app.use(helmet());

    // VALIDATION
    app.useGlobalPipes(new ValidationPipe());

    // SERVER starten
    await app.listen(3000);

    // DB bzw. DB-POPULATE
    const dbService = app.get(DbService);
    dbService.populateDB();
}
bootstrap();
