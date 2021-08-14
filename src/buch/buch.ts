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
 * Das Modul besteht aus dem Interfaces {@linkcode Buch} mit den Nutzdaten
 * einschließlich Id und Versionsnummer.
 * @packageDocumentation
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import type MUUID from 'uuid-mongodb';
import { dbConfig } from '../config';

/**
 * Alias-Typ für gültige Strings bei Verlagen.
 */
export type Verlag = 'BAR_VERLAG' | 'FOO_VERLAG';

/**
 * Alias-Typ für gültige Strings bei der Art eines Buches.
 */
export type BuchArt = 'DRUCKAUSGABE' | 'KINDLE';

/**
 * Nutzdaten im Anwendungskern.
 */
export type BuchDocument = Buch & Document;

// Mongoose Schema mit NestJS
// https://docs.nestjs.com/techniques/mongodb#model-injection
// Schemas can be created with NestJS decorators, or with Mongoose itself manually.
// Using decorators to create schemas greatly reduces boilerplate and improves
// overall code readability.

const MONGOOSE_OPTIONS = {
    // https://mongoosejs.com/docs/guide.html#options
    // default: virtueller getter "id"
    // id: true,

    // createdAt und updatedAt als automatisch gepflegte Felder
    timestamps: true,
    // http://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html
    optimisticConcurrency: true,
    autoIndex: dbConfig.autoIndex,
};

// Das Schema für Mongoose kann hier mit dem Decorator @Schema direkt aus der Klasse erzeugt werden.
@Schema(MONGOOSE_OPTIONS)
export class Buch {
    _id?: MUUID.MUUID | string; // eslint-disable-line @typescript-eslint/naming-convention

    readonly __v?: number; // eslint-disable-line @typescript-eslint/naming-convention

    // https://docs.nestjs.com/techniques/mongodb#model-injection
    // https://mongoosejs.com/docs/schematypes.html
    // The schema types for these properties are automatically inferred thanks to TypeScript
    // metadata (and reflection) capabilities. However, in more complex scenarios in which
    // types cannot be implicitly reflected (for example, arrays or nested object structures),
    // types must be indicated explicitly, as follows:
    // @Prop([String])
    // tags: string[];

    @Prop({ type: String, required: true, unique: true })
    titel: string | null | undefined;

    @Prop({ type: Number, min: 0, max: 5 })
    readonly rating?: number | null | undefined;

    @Prop({ type: String, enum: ['DRUCKAUSGABE', 'KINDLE'] })
    readonly art: BuchArt | '' | null | undefined;

    @Prop({ type: String, required: true, enum: ['FOO_VERLAG', 'BAR_VERLAG'] })
    readonly verlag: Verlag | '' | null | undefined;

    @Prop({ type: Number, required: true })
    readonly preis?: number | undefined;

    @Prop({ type: Number })
    readonly rabatt?: number | undefined;

    @Prop({ type: Boolean })
    readonly lieferbar?: boolean | undefined;

    // das Temporal-API ab ES2022 wird von Mongoose nicht unterstuetzt
    // hier: Temporal.PlainDate
    // https://tc39.es/proposal-temporal/docs
    // string bei REST und Date bei GraphQL sowie Mongoose
    @Prop({ type: String })
    datum?: Date | string | undefined;

    @Prop({ type: String, required: true, unique: true, immutable: true })
    readonly isbn?: string | null | undefined;

    @Prop({ type: String })
    readonly homepage?: string | null | undefined;

    @Prop({ type: [String], sparse: true })
    readonly schlagwoerter?: string[] | null | undefined;

    @Prop({ type: {} })
    readonly autoren: unknown;
}

export const BuchSchema = SchemaFactory.createForClass(Buch);
