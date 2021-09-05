/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Buch } from './buch';

export class BuchQuery extends Buch {
    // @ApiProperty({ required: false })
    override readonly titel: string | undefined;

    // @ApiProperty({ required: false })
    override readonly rating?: number | undefined;

    // @ApiProperty({ required: false })
    // override readonly art: BuchArt | undefined;

    // @ApiProperty({ required: false })
    // override readonly verlag: Verlag | undefined;

    // @ApiProperty({ required: false })
    override readonly preis?: number | undefined;

    // @ApiProperty({ required: false })
    override readonly rabatt?: number | undefined;

    // @ApiProperty({ required: false })
    override readonly lieferbar?: boolean | undefined;

    // @ApiProperty({ required: false, type: String })
    override readonly datum?: string | undefined;

    // @ApiProperty({ required: false })
    override readonly isbn?: string | undefined;

    // @ApiProperty({ required: false })
    override readonly homepage?: string | undefined;

    // @ApiProperty({ example: true, type: Boolean, required: false })
    readonly javascript?: boolean | undefined;

    // @ApiProperty({ example: true, type: Boolean, required: false })
    readonly typescript?: boolean | undefined;
}
