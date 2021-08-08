import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { BuchDocument, Buch } from "./buch";

@Injectable()
export class BuchService {

	constructor(@InjectModel('Buch') private buchModel: Model<BuchDocument>) {}

	async create(buch: Buch): Promise<Buch> {
	  const createdBuch = new this.buchModel(buch);
	  return createdBuch.save();
	}
  
	async findAll(): Promise<Buch[]> {
	  return this.buchModel.find().exec();
	}
}
