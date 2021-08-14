import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { BuchSchema } from "../buch/buch";
import { DbService } from "./db.service";

@Module({
	imports: [
        MongooseModule.forFeature([{ name: 'Buch', schema: BuchSchema }]),
    ],
    controllers: [],
    providers: [DbService],
})
export class DbModule {}
