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

import { Body, Get, Param, Post, Req, Res } from '@nestjs/common';

import { Buch } from './buch';
import { BuchService } from './buch.service';
import { Controller } from '@nestjs/common';
import { logger } from '../shared';

@Controller('buecher')
export class BuchController {
    constructor(private readonly buchService: BuchService) {}

    // @Post()
    // async create(@Body('buch') buch: Buch) {
    //   await this.buchService.create(buch);
    // }

    @Get('/api')
    async findAll(): Promise<Buch[]> {
        logger.debug('BuchController.findAll()');

        return this.buchService.findAll();
    }

	@Get(':id')
	async findById(@Param("id") id:string,
) {
    // @Req() req: Request,
    // @Res() res: Response
		logger.debug("BuchController.findById()", id);

		return this.buchService.findById(id)
	}
}
