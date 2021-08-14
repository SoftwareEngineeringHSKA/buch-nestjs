import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuchModule } from './buch/buch.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { dbConfig } from './config/db';

@Module({
    imports: [MongooseModule.forRoot(dbConfig.url), BuchModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
