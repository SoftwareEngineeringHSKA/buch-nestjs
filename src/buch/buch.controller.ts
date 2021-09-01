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

import {Body, Delete, Get, HttpStatus, Param, Post, Query, Req, Res} from '@nestjs/common';
import {Controller} from '@nestjs/common';
import {ApiBadRequestResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOperation} from '@nestjs/swagger';
import {ObjectID} from 'bson';
import {Request, Response} from 'express';

import {Public} from '../auth/jwt-auth.guard';
import {getBaseUri, logger} from '../shared';

import {Buch, BuchDocument, BuchDTO, BuecherDTO} from './buch';
import {BuchQuery} from './buch.query';
import {BuchService} from './buch.service';
import {BuchInvalid, BuchNotExists, BuchServiceError, CreateError, IsbnExists, TitelExists, UpdateError, VersionInvalid, VersionOutdated} from './errors';

// @Controller ist ein Decorator von NestJS
// Wenn dem Controller keine weiteren Parameter übergeben werden,
// dann werden eingehende Requests direkt über den "Root-Pfad" des Hosts
// geroutet. Bsp. localhost/ Übergibt man dem Controller einen String wie bspw.
// @Controller('buch'), dann werden die Requests über folgenden Pfad geleitet:
// localhost/buch
@Controller('api/buecher')
export class BuchController {
  // Dependency Injection
  // Hier wird der BuchService in den BuchController eingebunden
  constructor(private readonly buchService: BuchService) {}


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
   * @param buch JSON-Daten für ein Buch im Request-Body.
   * @param res Leeres Response-Objekt von Express.
   * @returns Leeres Promise-Objekt.
   */
  @Post()
  @ApiOperation({summary: 'Ein neues Buch anlegen'})
  @ApiCreatedResponse({description: 'Erfolgreich neu angelegt'})
  @ApiBadRequestResponse({description: 'Fehlerhafte Buchdaten'})
  async create(
      @Body() buch: Buch,
      @Req() req: Request,
      @Res() res: Response,
  ) {
    logger.debug(`create: buch=${buch}`);

    const result = await this.buchService.create(buch);
    if (result instanceof BuchServiceError) {
      this.handleCreateError(result, res);
      return;
    }

    const location = `${getBaseUri(req)}/${result}`;
    logger.debug(`create: location=${location}`);
    res.location(location).send();
  }

  // ==========================================
  // ================== READ ==================
  // ==========================================

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
  @Public()
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
      const id = (buch.id as ObjectID).toString();  // eslint-disable-line
      // @typescript-eslint/no-base-to-string
      return this.toDTO(buch, req, id, false);
    });
    logger.debug(`find: buecherDTO=${buecherDTO}`);

    const result: BuecherDTO = {_embedded: {buecher: buecherDTO}};

    res.json(result).send();
  }

  // ==========================================
  // ================= UPDATE =================
  // ==========================================



  // ==========================================
  // ================= DELETE =================
  // ==========================================


  /**
   * Ein Buch wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
   * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
   *
   * @param id Pfad-Paramater für die ID.
   * @param res Leeres Response-Objekt von Express.
   * @returns Leeres Promise-Objekt.
   */
  @Delete(':id')
  @ApiOperation({summary: 'Buch mit der ID löschen'})
  @ApiNoContentResponse({
    description: 'Das Buch wurde gelöscht oder war nicht vorhanden',
  })
  async delete(@Param('id') id: string, @Res() res: Response) {
    logger.debug(`delete: id=${id}`);

    let deleted: boolean;
    try {
      deleted = await this.buchService.delete(id);
    } catch (err: unknown) {
      logger.error(`delete: error=${err}`);
      res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    logger.debug(`delete: deleted=${deleted}`);

    res.sendStatus(HttpStatus.NO_CONTENT);
  }

  // ==========================================
  // ================= UTILITY ================
  // ==========================================

  //  Data Transfer Object
  //  https://stackoverflow.com/questions/1051182/what-is-a-data-transfer-object-dto
  // eslint-disable-next-line max-params
  private toDTO(buch: BuchDocument, req: Request, id: string, all = true) {
    const baseUri = getBaseUri(req);
    logger.debug(`#toDTO: baseUri=${baseUri}`);
    const links = all ? {
      self: {href: `${baseUri}/${id}`},
      list: {href: `${baseUri}`},
      add: {href: `${baseUri}`},
      update: {href: `${baseUri}/${id}`},
      remove: {href: `${baseUri}/${id}`},
    } :
                        {self: {href: `${baseUri}/${id}`}};

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
    logger.debug(
        `#handleValidationError: messages=${messages}`,
    );
    res.status(HttpStatus.BAD_REQUEST).send(messages);
  }

  private handleTitelExists(titel: string|null|undefined, res: Response) {
    const msg = `Der Titel "${titel}" existiert bereits.`;
    logger.debug(`#handleTitelExists(): msg=${msg}`);
    res.status(HttpStatus.BAD_REQUEST)
        .set('Content-Type', 'text/plain')
        .send(msg);
  }

  private handleIsbnExists(isbn: string|null|undefined, res: Response) {
    const msg = `Die ISBN-Nummer "${isbn}" existiert bereits.`;
    logger.debug(`#handleIsbnExists(): msg=${msg}`);
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
      const {id} = err;
      const msg = `Es gibt kein Buch mit der ID "${id}".`;
      logger.debug(`#handleUpdateError: msg=${msg}`);
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
      const {version} = err;
      const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
      logger.debug(`#handleUpdateError: msg=${msg}`);
      res.status(HttpStatus.PRECONDITION_FAILED)
          .set('Content-Type', 'text/plain')
          .send(msg);
      return;
    }

    if (err instanceof VersionOutdated) {
      const {version} = err;
      const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
      logger.debug(`#handleUpdateError: msg=${msg}`);
      res.status(HttpStatus.PRECONDITION_FAILED)
          .set('Content-Type', 'text/plain')
          .send(msg);
    }
  }
}
