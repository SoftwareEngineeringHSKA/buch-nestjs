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

import { Body, Get, Param, Post } from '@nestjs/common';

import { Buch } from './buch';
import { BuchService } from './buch.service';
import { Controller } from '@nestjs/common';
import { logger } from '../shared';

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
    @Get('')
    async findAll(): Promise<Buch[]> {
        logger.debug('BuchController.findAll()');

        return this.buchService.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        logger.debug('BuchController.findById()', id);
        return this.buchService.findById(id);
    }
}
