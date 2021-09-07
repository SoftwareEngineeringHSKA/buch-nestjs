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

import {
    DocumentBuilder,
    SwaggerCustomOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { k8sConfig, nodeConfig } from './config';
import { release, type, userInfo } from 'os';

import { AppModule } from './app.module';
import { DbService } from './db/db.service';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { NestFactory } from '@nestjs/core';
import { Temporal } from '@js-temporal/polyfill';
import helmet from 'helmet';
import ip from 'ip';
import stripIndent from 'strip-indent';

const { host, nodeEnv, port, serviceHost, servicePort } = nodeConfig;
const isK8s = k8sConfig.detected;
let httpsOptions: HttpsOptions | undefined;
const swaggerPath = 'swagger';

// "Arrow Function" ab ES 2015
const logInfos = () => {
    const logger = new Logger('main');

    const banner = `
        .       __                                    _____
        .      / /_  _____  _________ ____  ____     /__  /
        . __  / / / / / _ \\/ ___/ __ \`/ _ \\/ __ \\      / /
        ./ /_/ / /_/ /  __/ /  / /_/ /  __/ / / /     / /___
        .\\____/\\__,_/\\___/_/   \\__, /\\___/_/ /_/     /____(_)
        .                     /____/
        . und Florian G.
    `;

    logger.log(stripIndent(banner));
    // https://nodejs.org/api/process.html
    // "Template String" ab ES 2015
    logger.log(`Node: ${process.version}`);
    logger.log(`NODE_ENV: ${nodeEnv}`);
    logger.log(`Kubernetes: ${isK8s ? 'OK' : 'N/A'}`);
    // Nullish Coalescing
    logger.log(`BUCH_SERVICE_HOST: ${serviceHost ?? 'N/A'}`);
    logger.log(`BUCH_SERVICE_PORT: ${servicePort ?? 'N/A'}`);
    logger.log(`Rechnername: ${host}`);
    logger.log(`IP-Adresse: ${ip.address()}`);
    logger.log(`Port: ${port}`);
    logger.log(`${httpsOptions === undefined ? 'HTTP' : 'HTTPS'}`);
    logger.log(`Betriebssystem: ${type()} ${release()}`);
    logger.log(`Username: ${userInfo().username}`);
    logger.log(`${Temporal.Now.plainDateTimeISO('Europe/Berlin').toString()}`);
    logger.log(`OpenAPI: /${swaggerPath}`);
};

// CORS CONFIGURATION
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // SWAGGER
    const config = new DocumentBuilder()
        .setTitle('Bücher Beispiel')
        .setDescription(
            'REST-Schnittstelle einer beispielhaften NestJS Anwendung',
        )
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Hier JWT Token einfügen',
                in: 'header',
            },
            'token',
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);
    const customSwaggerOptions: SwaggerCustomOptions = {
        customSiteTitle: 'Swagger - BuchBeispiel - NestJS',
    };

    SwaggerModule.setup(swaggerPath, app, document, customSwaggerOptions);

    // HELMET
    app.use(helmet());

    // CORS
    app.enableCors(corsOptions);

    // VALIDATION
    app.useGlobalPipes(new ValidationPipe());

    // SERVER starten
    await app.listen(3000);

    // Banner mit Informationen
    logInfos();

    // DB bzw. DB-POPULATE
    const dbService = app.get(DbService);
    dbService.populateDB();
}
bootstrap();
