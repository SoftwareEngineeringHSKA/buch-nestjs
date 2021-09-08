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
import { ObjectID } from 'bson';
import { Connection, Model } from 'mongoose';

import { Buch, BuchDocument } from './buch';

import type { FilterQuery, QueryOptions } from 'mongoose';
import {
    BuchInvalid,
    IsbnExists,
    TitelExists,
    BuchServiceError,
    BuchNotExists,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import { validateBuch } from './validateBuch';
import { Logger } from '@nestjs/common';
import { safeStringify } from 'ajv/dist/compile/codegen/code';

@Injectable()
export class BuchService {
    readonly UPDATE_OPTIONS: QueryOptions = { new: true };

    readonly #logger: Logger;

    // Once you've registered the schema, you can inject a Buch model into the
    // BuchService using the @InjectModel() decorator:
    constructor(@InjectModel('Buch') private buchModel: Model<BuchDocument>) {
        this.#logger = new Logger(BuchService.name);
    }

    // ==========================================
    // ================= CREATE =================
    // ==========================================

    async create(
        buch: Buch,
    ): Promise<BuchInvalid | IsbnExists | TitelExists | string> {
        this.#logger.debug(`create: buch=${buch}`);
        const validateResult = await this.validateCreate(buch);
        if (validateResult instanceof BuchServiceError) {
            return validateResult;
        }

        const buchDocument = new this.buchModel(buch);
        const saved = await buchDocument.save();
        // id als "virtuelle" Mongoose-Funktion in buchSchema
        const id: string = saved.id.toString(); // eslint-disable-line
        // @typescript-eslint/no-unsafe-assignment
        this.#logger.log(`create: id=${id}`);

        // await this.#sendmail(saved);

        return id;
    }

    // ==========================================
    // ================== READ ==================
    // ==========================================

    /**
     * Ein Buch asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Buches
     * @returns Das gefundene Buch vom Typ {@linkcode Buch} oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
    async findById(idStr: string) {
        this.#logger.debug('BuchService.findById()');

        // ein Buch zur gegebenen ID asynchron mit Mongoose suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // Das Resultat ist null, falls nicht gefunden.
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document,
        // so dass u.a. der virtuelle getter "id" auch nicht mehr vorhanden ist.

        if (!ObjectID.isValid(idStr)) {
            this.#logger.error('Keine gueltige ObjectID');
            return undefined;
        }

        const id = new ObjectID(idStr);
        const buch = await this.buchModel.findById(id);
        this.#logger.log(`findById: buch=${buch}`);

        if (buch === null) {
            return undefined;
        }
        return buch;
    }

    async findAll() {
        this.#logger.debug('BuchService.findAll()');

        const buecher = await this.buchModel.find();
        if (buecher) return buecher;
        else {
            this.#logger.warn('BuchService.findAll() - Keine Bücher gefunden!');
        }
    }

    /**
     * Bücher asynchron suchen.
     * @param query Die DB-Query als JSON-Objekt
     * @returns Ein JSON-Array mit den gefundenen Büchern. Ggf. ist das Array
     * leer.
     */
    // eslint-disable-next-line max-lines-per-function
    async find(query?: FilterQuery<BuchDocument> | undefined) {
        this.#logger.debug(`find: query=${query}`);

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
        if (titel && typeof titel === 'string') {
            // RegEx flags
            // g : matches the pattern multiple times.
            // i : makes the regex case insensitive.
            // m : enables multi-line mode. ...
            // u : enables support for unicode.
            // s : short for single line, it causes the . to also match new line
            // characters.
            dbQuery.titel =
                // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                titel.length < 10
                    ? new RegExp(titel, 'iu') // eslint-disable-line security/detect-non-literal-regexp,
                    : // security-node/non-literal-reg-expr
                      titel;
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
        this.#logger.log(`find: buecher=${buecher}`);

        return buecher;
    }

    // ==========================================
    // ================= UPDATE =================
    // ==========================================

    /**
     * Ein vorhandenes Buch soll aktualisiert werden.
     * @param buch Das zu aktualisierende Buch
     * @param id ID des zu aktualisierenden Buchs
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall
     *  - {@linkcode BuchInvalid}, falls Constraints verletzt sind
     *  - {@linkcode BuchNotExists}, falls das Buch nicht existiert
     *  - {@linkcode TitelExists}, falls der Titel bereits existiert
     *  - {@linkcode VersionInvalid}, falls die Versionsnummer ungültig ist
     *  - {@linkcode VersionOutdated}, falls die Versionsnummer nicht aktuell ist
     */
    async update(
        buch: Buch,
        id: string,
        version: string,
    ): Promise<
        | BuchInvalid
        | BuchNotExists
        | TitelExists
        | VersionInvalid
        | VersionOutdated
        | number
    > {
        this.#logger.debug(
            `update: buch=${buch}, id=${id}, version=${version}`,
        );
        if (!ObjectID.isValid(id)) {
            this.#logger.error('Keine gueltige ObjectID');
            return new BuchNotExists(id);
        }

        const validateResult = await this.validateUpdate(buch, id, version);
        if (validateResult instanceof BuchServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        // Weitere Methoden zum Aktualisieren:
        //    Document.findOneAndUpdate(update)
        //    document.updateOne(bedingung)
        const updated = await this.buchModel.findByIdAndUpdate(
            new ObjectID(id),
            buch,
            this.UPDATE_OPTIONS,
        );
        if (updated === null) {
            return new BuchNotExists(id);
        }

        const versionUpdated = updated.__v as number;
        this.#logger.log(`update: versionUpdated=${versionUpdated}`);

        return versionUpdated;
    }

    // ==========================================
    // ================= DELETE =================
    // ==========================================

    /**
     * Ein Buch wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Buches
     * @returns true, falls das Buch vorhanden war und gelöscht wurde. Sonst
     * false.
     */
    async delete(idStr: string) {
        this.#logger.debug(`delete: idStr=${idStr}`);
        if (!ObjectID.isValid(idStr)) {
            this.#logger.error('delete: Keine gueltige ObjectID');
            return false;
        }

        // Das Buch zur gegebenen ID asynchron loeschen
        const deleted = await this.buchModel
            .findByIdAndDelete(new ObjectID(idStr))
            .lean<Buch | null>();
        this.#logger.log(`delete: deleted=${deleted}`);
        return deleted !== null;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Buch.findByIdAndRemove(id)
        //  Buch.findOneAndRemove(bedingung)
    }

    // ==========================================
    // ================= UTILITY ================
    // ==========================================

    private async validateCreate(buch: Buch) {
        const msg = validateBuch(buch);
        if (msg.length > 0) {
            this.#logger.debug(`#validateCreate: Validation Message: ${msg}`);
            return new BuchInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const { titel } = buch;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await this.buchModel.exists({ titel })) {
            return new TitelExists(titel);
        }

        const { isbn } = buch;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await this.buchModel.exists({ isbn })) {
            return new IsbnExists(isbn);
        }

        this.#logger.log('#validateCreate: ok');
        return undefined;
    }

    private async validateUpdate(buch: Buch, id: string, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            `#validateUpdate: buch=${safeStringify(buch)}, version=${version}`,
        );

        const validationMsg = validateBuch(buch);
        if (validationMsg.length > 0) {
            return new BuchInvalid(validationMsg);
        }

        const resultTitel = await this.checkTitelExists(buch);
        if (resultTitel !== undefined && resultTitel.id !== id) {
            return resultTitel;
        }

        const resultIdAndVersion = await this.checkIdAndVersion(id, version);
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        this.#logger.log('#validateUpdate: ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            this.#logger.debug(`#validateVersion: VersionInvalid=${error}`);
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            this.#logger.debug(`#validateVersion: VersionInvalid=${error}`);
            return error;
        }

        return version;
    }

    private async checkTitelExists(buch: Buch) {
        const { titel } = buch;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        const result = await this.buchModel.findOne({ titel }, { _id: true });
        if (result !== null) {
            const id = (result.id as ObjectID).toString(); // eslint-disable-line
            // @typescript-eslint/no-base-to-string
            this.#logger.debug(`#checkTitelExists: id=${id}`);
            return new TitelExists(titel, id);
        }

        this.#logger.log('#checkTitelExists: ok');
        return undefined;
    }

    private async checkIdAndVersion(id: string, version: number) {
        const buchDb = await this.buchModel.findById(id);
        if (buchDb === null) {
            const result = new BuchNotExists(id);
            this.#logger.debug(`#checkIdAndVersion: BuchNotExists=${result}`);
            return result;
        }

        // nullish coalescing
        const versionDb = (buchDb.__v ?? 0) as number;
        if (version < versionDb) {
            const result = new VersionOutdated(id, version);
            this.#logger.debug(`#checkIdAndVersion: VersionOutdated=${result}`);
            return result;
        }

        return undefined;
    }
}
