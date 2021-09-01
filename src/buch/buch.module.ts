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

import {Module} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';
import {MongooseModule} from '@nestjs/mongoose';

import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {RolesGuard} from '../users/roles.guard';

import {BuchSchema} from './buch';
import {BuchController} from './buch.controller';
import {BuchService} from './buch.service';

@Module({
  imports: [
    MongooseModule.forFeature([{name: 'Buch', schema: BuchSchema}]),
  ],
  controllers: [BuchController],
  providers: [
    BuchService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class BuchModule {
}
