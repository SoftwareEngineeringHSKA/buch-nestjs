import {Controller, Get, Post, Request, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiBasicAuth} from '@nestjs/swagger';

import {AppService} from './app.service';
import {AuthService} from './auth/auth.service';
import {JwtAuthGuard, Public} from './auth/jwt-auth.guard';
import {LocalAuthGuard} from './auth/local-auth.guard';


@ApiBasicAuth()
@Controller()
export class AppController {
  constructor(
      private readonly appService: AppService,
      private readonly authService: AuthService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('auth/login')
  @ApiBasicAuth()
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
