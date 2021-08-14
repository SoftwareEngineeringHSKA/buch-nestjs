import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuchModule } from './buch/buch.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { dbConfig } from './config/db';
import { DbService } from "./db/db.service";
import { DbModule } from './db/db.module';

@Module({
    imports: [MongooseModule.forRoot(dbConfig.url), BuchModule, DbModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
