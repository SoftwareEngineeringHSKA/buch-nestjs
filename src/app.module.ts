import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuchController } from './buch/buch.controller';
import { BuchModule } from './buch/buch.module';
import { BuchSchema } from './buch/buch';
import { BuchService } from './buch/buch.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { dbConfig } from './config/db';

@Module({
    imports: [MongooseModule.forRoot(dbConfig.url), BuchModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
