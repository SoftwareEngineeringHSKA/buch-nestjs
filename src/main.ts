/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
