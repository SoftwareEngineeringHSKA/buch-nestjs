import { Body, Get, Post } from '@nestjs/common';

import { Buch } from './buch';
import { BuchService } from './buch.service';
import { Controller } from '@nestjs/common';

@Controller('buecher')
export class BuchController {
    constructor(private readonly buchService: BuchService) {}

    // @Post()
    // async create(@Body('buch') buch: Buch) {
    //   await this.buchService.create(buch);
    // }

    @Get('/api')
    async findAll(): Promise<Buch[]> {
        return this.buchService.findAll();
    }
}
