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

import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { BuchDocument, Buch } from './buch';
import { logger } from '../shared';
import { ObjectID } from 'bson';
import type { FilterQuery, QueryOptions } from 'mongoose';



@Injectable()
export class BuchService {
    // Once you've registered the schema, you can inject a Buch model into the BuchService
    // using the @InjectModel() decorator:
    constructor(@InjectModel('Buch') private buchModel: Model<BuchDocument>) {}

    async findAll() {
        logger.debug('BuchService.findAll()');

        const buecher = await this.buchModel.find();
        if (buecher) return buecher;
        else {
            logger.debug('BuchService.findAll() - Keine Bücher gefunden!');
        }
    }

    /**
     * Ein Buch asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Buches
     * @returns Das gefundene Buch vom Typ {@linkcode Buch} oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
    async findById(idStr: string) {
        logger.debug('BuchService.findById()');

        // ein Buch zur gegebenen ID asynchron mit Mongoose suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // Das Resultat ist null, falls nicht gefunden.
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document,
        // so dass u.a. der virtuelle getter "id" auch nicht mehr vorhanden ist.

        if (!ObjectID.isValid(idStr)) {
            logger.debug('Keine gueltige ObjectID');
            return undefined;
        }

        const id = new ObjectID(idStr);
        const buch = await this.buchModel.findById(id);
        logger.debug(`findById: buch=${buch}`);

        if (buch === null) {
            return undefined;
        }
        return buch;

    }

        /**
     * Bücher asynchron suchen.
     * @param query Die DB-Query als JSON-Objekt
     * @returns Ein JSON-Array mit den gefundenen Büchern. Ggf. ist das Array leer.
     */
    // eslint-disable-next-line max-lines-per-function
    async find(query?: FilterQuery<BuchDocument> | undefined) {
        logger.debug(`find: query=${query}`);

        // alle Buecher asynchron suchen u. aufsteigend nach titel sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            return this.findAll();
        }

        // { titel: 'a', rating: 5, javascript: true }
        // Rest Properties
        const { titel, javascript, typescript, ...dbQuery } = query;

        // Checks if title is NOT:
        // null
        // undefined
        // NaN
        // empty string ("")
        // 0
        // false
        if (
            titel &&
            typeof titel === 'string'
        ) {
            // RegEx flags
            // g : matches the pattern multiple times.
            // i : makes the regex case insensitive.
            // m : enables multi-line mode. ...
            // u : enables support for unicode.
            // s : short for single line, it causes the . to also match new line characters.
            dbQuery.titel =
                // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                titel.length < 10
                    ? new RegExp(titel, 'iu') // eslint-disable-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                    : titel;
        }

        // z.B. {javascript: true, typescript: true}
        const schlagwoerter = [];
        if (javascript === 'true') {
            schlagwoerter.push('JAVASCRIPT');
        }
        if (typescript === 'true') {
            schlagwoerter.push('TYPESCRIPT');
        }
        if (schlagwoerter.length === 0) {
            if (Array.isArray(dbQuery.schlagwoerter)) {
                dbQuery.schlagwoerter.splice(0);
            }
        } else {
            dbQuery.schlagwoerter = schlagwoerter;
        }

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // Model<Document>.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        const buecher = await this.buchModel.find(
            dbQuery as FilterQuery<BuchDocument>,
        );
        logger.debug(`find: buecher=${buecher}`);

        return buecher;
    }
}
