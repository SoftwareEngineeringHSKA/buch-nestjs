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

import { Logger, Put } from '@nestjs/common';

import {
    Body,
    Delete,
    Get,
    Headers,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBasicAuth,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ObjectID } from 'bson';
import { Request, Response } from 'express';

import { Public } from '../auth/jwt-auth.guard';
import { getBaseUri } from '../shared';
import { Role } from '../users/role.enum';
import { Roles } from '../users/roles.decorator';
import safeStringify from 'fast-safe-stringify';

import { Buch, BuchDocument, BuchDTO, BuecherDTO } from './buch';
import { BuchQuery } from './buch.query';
import { BuchService } from './buch.service';
import {
    BuchInvalid,
    BuchNotExists,
    BuchServiceError,
    CreateError,
    IsbnExists,
    TitelExists,
    UpdateError,
    VersionInvalid,
    VersionOutdated,
} from './errors';

// @Controller ist ein Decorator von NestJS
// Wenn dem Controller keine weiteren Parameter ??bergeben werden,
// dann werden eingehende Requests direkt ??ber den "Root-Pfad" des Hosts
// geroutet. Bsp. localhost/ ??bergibt man dem Controller einen String wie bspw.
// @Controller('buch'), dann werden die Requests ??ber folgenden Pfad geleitet:
// localhost/buch
@ApiBearerAuth('token')
@ApiBasicAuth()
@ApiTags('B??cher')
@Controller('api/buecher')
export class BuchController {
    readonly #logger: Logger;

    // API Operations f??r Swagger
    // https://docs.nestjs.com/openapi/operations

    // Dependency Injection
    // Hier wird der BuchService in den BuchController eingebunden
    constructor(private readonly buchService: BuchService) {
        this.#logger = new Logger(BuchController.name);
    }

    // ==========================================
    // ================= CREATE =================
    // ==========================================

    /**
     * Ein neues Buch wird asynchron angelegt. Das neu anzulegende Buch ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Buch abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn der Titel oder die ISBN-Nummer bereits
     * existieren.
     *
     * @param buch JSON-Daten f??r ein Buch im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Ein neues Buch anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Buchdaten' })
    @ApiUnauthorizedResponse({
        description: 'Nicht angemeldet',
    })
    @ApiForbiddenResponse({
        description: 'Fehlende Berechtigung zum Anlegen eines Buches',
    })
    async create(
        @Body() buch: Buch,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.#logger.debug(`create: buch=${buch}`);

        const result = await this.buchService.create(buch);
        if (result instanceof BuchServiceError) {
            this.handleCreateError(result, res);
            return;
        }

        const location = `${getBaseUri(req)}/api/buecher/${result}`;
        this.#logger.debug(`create: location=${location}`);
        res.location(location).send();
    }

    // ==========================================
    // ================== READ ==================
    // ==========================================

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Buch anhand der ID suchen' })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header f??r bedingte GET-Requests',
        required: false,
    })
    @ApiOkResponse({ description: 'Das Buch wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Buch zur ID gefunden' })
    // https://github.com/nestjs/swagger/issues/1501
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Das Buch wurde bereits heruntergeladen',
    })
    async findById(@Param('id') id: string) {
        // @Req() req: Request,
        // @Res() res: Response
        this.#logger.debug('BuchController.findById()', id);

        return this.buchService.findById(id);
    }

    /**
     * B??cher werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Buch gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen B??chern, die jeweils
     * um Atom-Links f??r HATEOAS erg??nzt sind.
     *
     * Falls es kein Buch zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle B??cher ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Public()
    @Get()
    @ApiOperation({ summary: 'B??cher mit Suchkriterien suchen' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit B??chern' })
    async find(
        @Query() query: BuchQuery,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.#logger.debug(`find: query=${safeStringify(query)}`);

        const buecher = await this.buchService.find(query);
        this.#logger.debug(`find: ${safeStringify(buecher)}`);

        // HATEOAS: Atom Links je Buch
        const buecherDTO = buecher.map((buch) => {
            const id = (buch.id as ObjectID).toString(); // eslint-disable-line
            // @typescript-eslint/no-base-to-string
            return this.toDTO(buch, req, id, false);
        });
        this.#logger.debug(`find: buecherDTO=${safeStringify(buecherDTO)}`);

        const result: BuecherDTO = { _embedded: { buecher: buecherDTO } };

        res.json(result).send();
    }

    // ==========================================
    // ================= UPDATE =================
    // ==========================================
    @Put(':id')
    @ApiOperation({ summary: 'Ein vorhandenes Buch aktualisieren' })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header f??r optimistische Synchronisation',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Buchdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({ status: 428, description: 'Header "If-Match" fehlt' })
    @ApiUnauthorizedResponse({
        description: 'Nicht angemeldet',
    })
    @ApiForbiddenResponse({
        description: 'Fehlende Berechtigung zum Aktualisieren eines Buches',
    })
    async update(
        @Body() buch: Buch,
        @Param('id') id: string,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ) {
        this.#logger.debug(
            `update: buch=${safeStringify(buch)}, id=${id}, version=${version}`,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug(`#handleUpdateError: ${msg}`);
            // https://github.com/nestjs/nest/issues/7859
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            res.status(428).set('Content-Type', 'text/plain').send(msg);
            return;
        }

        const result = await this.buchService.update(buch, id, version);
        if (result instanceof BuchServiceError) {
            this.handleUpdateError(result, res);
            return;
        }

        this.#logger.debug(`update: version=${result}`);
        res.set('ETag', result.toString()).sendStatus(HttpStatus.NO_CONTENT);
    }

    // ==========================================
    // ================= DELETE =================
    // ==========================================

    /**
     * Ein Buch wird anhand seiner ID-gel??scht, die als Pfad-Parameter angegeben
     * ist. Der zur??ckgelieferte Statuscode ist `204` (`No Content`).
     *
     * @param id Pfad-Paramater f??r die ID.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Buch mit der ID l??schen' })
    @ApiNoContentResponse({
        description: 'Das Buch wurde gel??scht oder war nicht vorhanden',
    })
    @ApiUnauthorizedResponse({
        description: 'Nicht angemeldet',
    })
    @ApiForbiddenResponse({
        description: 'Fehlende Berechtigung zum L??schen eines Buches',
    })
    async delete(@Param('id') id: string, @Res() res: Response) {
        this.#logger.debug(`delete: id=${id}`);

        let deleted: boolean;
        try {
            deleted = await this.buchService.delete(id);
        } catch (err: unknown) {
            this.#logger.error(`delete: error=${err}`);
            res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            return;
        }
        this.#logger.debug(`delete: deleted=${deleted}`);

        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    // ==========================================
    // ================= UTILITY ================
    // ==========================================

    //  Data Transfer Object
    //  https://stackoverflow.com/questions/1051182/what-is-a-data-transfer-object-dto
    // eslint-disable-next-line max-params
    private toDTO(buch: BuchDocument, req: Request, id: string, all = true) {
        const controllerPath = '/api/buecher';
        const baseUri = getBaseUri(req) + controllerPath;
        this.#logger.debug(`#toDTO: baseUri=${safeStringify(baseUri)}`);
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug(
            `#toDTO: buch=${safeStringify(buch)}, links=${links}`,
        );
        const buchDTO: BuchDTO = {
            titel: buch.titel,
            rating: buch.rating,
            art: buch.art,
            verlag: buch.verlag,
            preis: buch.preis,
            rabatt: buch.rabatt,
            lieferbar: buch.lieferbar,
            datum: buch.datum,
            isbn: buch.isbn,
            homepage: buch.homepage,
            schlagwoerter: buch.schlagwoerter,
            _links: links,
        };
        return buchDTO;
    }

    private handleCreateError(err: CreateError, res: Response) {
        if (err instanceof BuchInvalid) {
            this.handleValidationError(err.messages, res);
            return;
        }

        if (err instanceof TitelExists) {
            this.handleTitelExists(err.titel, res);
            return;
        }

        if (err instanceof IsbnExists) {
            this.handleIsbnExists(err.isbn, res);
        }
    }

    private handleValidationError(messages: readonly string[], res: Response) {
        this.#logger.debug(
            `#handleValidationError: messages=${safeStringify(messages)}`,
        );
        res.status(HttpStatus.BAD_REQUEST).send(messages);
    }

    private handleTitelExists(titel: string | null | undefined, res: Response) {
        const msg = `Der Titel "${titel}" existiert bereits.`;
        this.#logger.debug(`#handleTitelExists(): msg=${safeStringify(msg)}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private handleIsbnExists(isbn: string | null | undefined, res: Response) {
        const msg = `Die ISBN-Nummer "${isbn}" existiert bereits.`;
        this.#logger.debug(`#handleIsbnExists(): msg=${safeStringify(msg)}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private handleUpdateError(err: UpdateError, res: Response) {
        if (err instanceof BuchInvalid) {
            this.handleValidationError(err.messages, res);
            return;
        }

        if (err instanceof BuchNotExists) {
            const { id } = err;
            const msg = `Es gibt kein Buch mit der ID "${id}".`;
            this.#logger.debug(`#handleUpdateError: msg=${safeStringify(msg)}`);
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof TitelExists) {
            this.handleTitelExists(err.titel, res);
            return;
        }

        if (err instanceof VersionInvalid) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
            this.#logger.debug(`#handleUpdateError: msg=${safeStringify(msg)}`);
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof VersionOutdated) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
            this.#logger.debug(`#handleUpdateError: msg=${safeStringify(msg)}`);
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }
    }
}
