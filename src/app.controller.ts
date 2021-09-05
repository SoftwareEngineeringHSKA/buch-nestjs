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

import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBasicAuth,
    ApiBearerAuth,
    ApiExcludeEndpoint,
} from '@nestjs/swagger';

import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard, Public } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';

@ApiBearerAuth('token')
@ApiBasicAuth()
@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly authService: AuthService,
    ) {}

    @UseGuards(LocalAuthGuard)
    @Public()
    @ApiExcludeEndpoint()
    @Post('auth/login')
    @ApiBasicAuth()
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @ApiExcludeEndpoint()
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
