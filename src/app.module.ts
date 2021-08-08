import { BuchModule } from './buch/buch.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuchController } from './buch/buch.controller';
import { BuchService } from './buch/buch.service';
import { BuchSchema } from "./buch/buch";

@Module({
  imports: [MongooseModule.forRootAsync({
    useFactory: () => ({
      uri: 'mongodb://localhost/nest',
    })}), BuchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
