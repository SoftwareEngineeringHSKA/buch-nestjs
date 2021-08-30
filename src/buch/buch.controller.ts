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

import { Body, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ObjectID } from 'bson';
import { Request, Response } from 'express';

import { getBaseUri, logger } from '../shared';

import { Buch, BuchDocument, BuchDTO, BuecherDTO } from './buch';
import { BuchQuery } from './buch.query';
import { BuchService } from './buch.service';

// @Controller ist ein Decorator von NestJS
// Wenn dem Controller keine weiteren Parameter übergeben werden,
// dann werden eingehende Requests direkt über den "Root-Pfad" des Hosts geroutet. Bsp. localhost/
// Übergibt man dem Controller einen String wie bspw. @Controller('buch'),
// dann werden die Requests über folgenden Pfad geleitet: localhost/buch
@Controller('buecher')
export class BuchController {
    // Dependency Injection
    // Hier wird der BuchService in den BuchController eingebunden
    constructor(private readonly buchService: BuchService) {}

    // @Get ist ein Decorator von NestJS
    // Wird aufgerufen, wenn ein GET-Request über den im Controller angegebenen Pfad eintrifft.
    // Kann auch mit Parametern befüllt werden um z.B. ein GET-Request weiter zu flitern
    // Bsp. @Get('id') -> localhost/buch/id
    @Get('/api')
    async findAll(): Promise<Buch[]> {
        logger.debug('BuchController.findAll()');

        return this.buchService.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        // @Req() req: Request,
        // @Res() res: Response
        logger.debug('BuchController.findById()', id);

        return this.buchService.findById(id);
    }

    /**
     * Bücher werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Buch gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Büchern, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Buch zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Bücher ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    async find(
        @Query() query: BuchQuery,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        logger.debug(`find: query=${query}`);

        const buecher = await this.buchService.find(query);
        logger.debug(`find: ${buecher}`);

        // HATEOAS: Atom Links je Buch
        const buecherDTO = buecher.map((buch) => {
            const id = (buch.id as ObjectID).toString(); // eslint-disable-line
            // @typescript-eslint/no-base-to-string
            return this.toDTO(buch, req, id, false);
        });
        logger.debug(`find: buecherDTO=${buecherDTO}`);

        const result: BuecherDTO = { _embedded: { buecher: buecherDTO } };

        res.json(result).send();
    }

    //  Data Transfer Object
    //  https://stackoverflow.com/questions/1051182/what-is-a-data-transfer-object-dto
    // eslint-disable-next-line max-params
    private toDTO(buch: BuchDocument, req: Request, id: string, all = true) {
        const baseUri = getBaseUri(req);
        logger.debug(`#toDTO: baseUri=${baseUri}`);
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        logger.debug(`#toDTO: buch=${buch}, links=${links}`);
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
}
