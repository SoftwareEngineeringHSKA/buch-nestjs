import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiProperty } from '@nestjs/swagger';

import { UsersService } from '../users/users.service';
import { compareSync } from 'bcrypt';
import { User } from '../users/user';

@Injectable()
export class AuthService {
    readonly #logger: Logger;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {
        this.#logger = new Logger(AuthService.name);
    }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);
        if (this.checkPassword(user, pass)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.userId };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    private checkPassword(user: User | undefined, password: string) {
        if (user === undefined) {
            this.#logger.error('#checkPassword: Kein User-Objekt');
            return false;
        }

        // Beispiel:
        //  $2a$12$50nIBzoTSmFEDGI8nM2iYOO66WNdLKq6Zzhrswo6p1MBmkER5O/CO
        //  $ als Separator
        //  2a: Version von bcrypt
        //  12: 2**12 Iterationen
        //  die ersten 22 Zeichen kodieren einen 16-Byte Wert fuer den Salt
        //  danach das chiffrierte Passwort
        const result = compareSync(password, user.password);
        this.#logger.log(`#checkPassword: ${result}`);
        return result;
    }
}
