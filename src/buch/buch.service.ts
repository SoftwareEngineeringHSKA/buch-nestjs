import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { BuchDocument, Buch } from './buch';
import MUUID from 'uuid-mongodb';
import { logger } from '../shared';

@Injectable()
export class BuchService {
    // Once you've registered the schema, you can inject a Buch model into the BuchService
    // using the @InjectModel() decorator:
    constructor(
        @InjectModel(Buch.name) private buchModel: Model<BuchDocument>,
    ) {}

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
    async findById(id: string) {
        logger.debug('BuchService.findById()');

        // ein Buch zur gegebenen ID asynchron mit Mongoose suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // Das Resultat ist null, falls nicht gefunden.
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document,
        // so dass u.a. der virtuelle getter "id" auch nicht mehr vorhanden ist.
        const uuid = MUUID.from(id);
        const buch = await this.buchModel.findById(uuid).lean<Buch | null>();
        logger.debug('BuchService.findById(): buch=%o', buch);

        if (buch === null) {
            return undefined;
        }
        return buch;
    }
}
