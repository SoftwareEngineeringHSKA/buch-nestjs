import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        // Available options for jwt configuration:
        // https://github.com/mikenicholson/passport-jwt#configure-strategy
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // supplies the method by which the JWT will be
            // extracted from the Request. We will use the standard approach of supplying a bearer token in the
            // Authorization header of our API requests
            ignoreExpiration: false, // just to be explicit, we choose the default false setting, which delegates
            // the responsibility of ensuring that a JWT has not expired to the Passport module.This means that
            // if our route is supplied with an expired JWT, the request will be denied and a 401 Unauthorized
            // response sent.Passport conveniently handles this automatically for us.
            secretOrKey: jwtConstants.secret, // we are using the expedient option of supplying a symmetric secret
            // for signing the token.Other options, such as a PEM- encoded public key, may be more appropriate for
            // production apps.In any case, as cautioned earlier, do not expose this secret publicly.
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username };
    }
}
