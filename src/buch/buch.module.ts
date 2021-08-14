import { BuchController } from './buch.controller';
import { BuchService } from './buch.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { buchSchema } from './buch';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Buch', schema: buchSchema }]),
    ],
    controllers: [BuchController],
    providers: [BuchService],
})
export class BuchModule {}
