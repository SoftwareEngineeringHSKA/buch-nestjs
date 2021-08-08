
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BuchDocument = Buch & Document;

@Schema()
export class Buch {
  @Prop({type: String})
  titel: string;

}

export const BuchSchema = SchemaFactory.createForClass(Buch);
