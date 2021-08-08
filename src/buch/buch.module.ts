
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuchSchema } from "./buch";
import { BuchController } from './buch.controller';
import { BuchService } from './buch.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: "Buch", schema: BuchSchema }])],
  controllers: [BuchController],
  providers: [BuchService]
})
export class BuchModule {}