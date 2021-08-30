import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        // Hint;
        // We can pass an options object in the call to super() to customize the behavior of the passport strategy.
        // In this example, the passport - local strategy by default expects properties called username and password in
        // the request body.Pass an options object to specify different property names, for example: super({ usernameField: 'email' }).
        // See the Passport documentation for more information.
        super();
    }

    async validate(username: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
