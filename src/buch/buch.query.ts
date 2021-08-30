import {Buch} from './buch';

export class BuchQuery extends Buch {
  // @ApiProperty({ required: false })
  override readonly titel: string|undefined;

  // @ApiProperty({ required: false })
  override readonly rating?: number|undefined;

  // @ApiProperty({ required: false })
  // override readonly art: BuchArt | undefined;

  // @ApiProperty({ required: false })
  // override readonly verlag: Verlag | undefined;

  // @ApiProperty({ required: false })
  override readonly preis?: number|undefined;

  // @ApiProperty({ required: false })
  override readonly rabatt?: number|undefined;

  // @ApiProperty({ required: false })
  override readonly lieferbar?: boolean|undefined;

  // @ApiProperty({ required: false, type: String })
  override readonly datum?: string|undefined;

  // @ApiProperty({ required: false })
  override readonly isbn?: string|undefined;

  // @ApiProperty({ required: false })
  override readonly homepage?: string|undefined;

  // @ApiProperty({ example: true, type: Boolean, required: false })
  readonly javascript?: boolean|undefined;

  // @ApiProperty({ example: true, type: Boolean, required: false })
  readonly typescript?: boolean|undefined;
}