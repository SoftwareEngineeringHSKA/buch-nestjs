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

/**
 * Das Modul enthält die Funktion, um die Test-DB neu zu laden.
 * @packageDocumentation
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Buch } from '../buch/buch';
import type { ObjectID } from 'bson';
import safeStringify from 'fast-safe-stringify';

@Injectable()
export class DbService {
    #logger: Logger;

    constructor(@InjectModel('Buch') private buchModel: Model<Buch>) {
        this.#logger = new Logger(DbService.name);
    }

    /**
     * Die Testdaten, um die Test-DB neu zu laden, als JSON-Array.
     */
    /* eslint-disable @typescript-eslint/naming-convention */
    private readonly testdaten: Buch[] = [
        {
            // id: new ObjectID('00000000-0000-0000-0000-000000000001'),
            titel: 'Alpha',
            rating: 4,
            art: 'DRUCKAUSGABE',
            verlag: 'FOO_VERLAG',
            preis: 11.1,
            rabatt: 0.011,
            lieferbar: true,
            // https://docs.mongodb.com/manual/reference/method/Date
            datum: new Date('2021-02-01'),
            isbn: '9783897225831',
            homepage: 'https://acme.at/',
            schlagwoerter: ['JAVASCRIPT'],
            // autoren: [
            //     {
            //         nachname: 'Alpha',
            //         vorname: 'Adriana',
            //     },
            //     {
            //         nachname: 'Alpha',
            //         vorname: 'Alfred',
            //     },
            // ],
            // __v: 0,
        },
        {
            // _id: MUUID.from('00000000-0000-0000-0000-000000000002'),
            titel: 'Beta',
            rating: 2,
            art: 'KINDLE',
            verlag: 'BAR_VERLAG',
            preis: 22.2,
            rabatt: 0.022,
            lieferbar: true,
            datum: new Date('2021-02-02'),
            isbn: '9783827315526',
            homepage: 'https://acme.biz/',
            schlagwoerter: ['TYPESCRIPT'],
            // autoren: [
            //     {
            //         nachname: 'Beta',
            //         vorname: 'Brunhilde',
            //     },
            // ],
            // __v: 0,
        },
        {
            // _id: MUUID.from('00000000-0000-0000-0000-000000000003'),
            titel: 'Gamma',
            rating: 1,
            art: 'DRUCKAUSGABE',
            verlag: 'FOO_VERLAG',
            preis: 33.3,
            rabatt: 0.033,
            lieferbar: true,
            datum: new Date('2021-02-03'),
            isbn: '9780201633610',
            homepage: 'https://acme.com/',
            schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
            // autoren: [
            //     {
            //         nachname: 'Gamma',
            //         vorname: 'Claus',
            //     },
            // ],
            // __v: 0,
        },
        {
            // _id: MUUID.from('00000000-0000-0000-0000-000000000004'),
            titel: 'Delta',
            rating: 3,
            art: 'DRUCKAUSGABE',
            verlag: 'BAR_VERLAG',
            preis: 44.4,
            rabatt: 0.044,
            lieferbar: true,
            datum: new Date('2021-02-04'),
            isbn: '978038753406',
            homepage: 'https://acme.de/',
            schlagwoerter: [],
            //   autoren:
            //       [
            //         {
            //           nachname: 'Delta',
            //           vorname: 'Dieter',
            //         },
            //       ],
            // __v: 0,
        },
        {
            // _id: MUUID.from('00000000-0000-0000-0000-000000000005'),
            titel: 'Epsilon',
            rating: 2,
            art: 'KINDLE',
            verlag: 'FOO_VERLAG',
            preis: 55.5,
            rabatt: 0.055,
            lieferbar: true,
            datum: new Date('2021-02-05'),
            isbn: '9783824404810',
            homepage: 'https://acme.es/',
            schlagwoerter: ['TYPESCRIPT'],
            //   autoren:
            //       [
            //         {
            //           nachname: 'Epsilon',
            //           vorname: 'Elfriede',
            //         },
            //       ],
            // __v: 0,
        },
    ];
    /* eslint-enable @typescript-eslint/naming-convention */

    /**
     * Die Test-DB wird im Development-Modus neu geladen.
     */
    async populateDB() {
        // https://stackoverflow.com/questions/46013256/check-if-collection-exists-before-dropping-in-mongoose#answer-46013595
        // https://kb.objectrocket.com/postgresql/mongoose-drop-collection-if-exists-605
        const collections = await this.buchModel.db.db
            .listCollections({ name: this.buchModel.collection.name })
            .toArray();
        if (collections.length > 0) {
            await this.buchModel.collection.drop();
        }

        const collection = await this.buchModel.createCollection();
        this.#logger.warn(
            `Die Collection ${safeStringify(
                collection.collectionName,
            )} wurde neu angelegt.`,
        );

        const insertedDocs = await this.buchModel.insertMany(this.testdaten, {
            lean: true,
        });
        // this.testdaten.forEach(
        //     data => {
        //         logger.debug(data._id)
        //     }
        // )
        this.#logger.warn(
            `${safeStringify(
                insertedDocs.length,
            )} Datensaetze wurden eingefuegt.`,
        );
    }
}
