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

/**
 * Das Modul besteht aus dem JSON-Array mit den vorhandenen Benutzerkennungen
 * vom Typ {@linkcode User}.
 * @packageDocumentation
 */

import { env } from '../config/env';
import { Role } from './role.enum';
import type { User } from './user';

const { password } = env.authConfigEnv;

/**
 * Ein JSON-Array der Benutzerdaten mit den vorhandenen Rollen.
 * Nicht Set, weil es dafür keine Suchfunktion gibt.
 */
export const users: User[] = [
    {
        id: '20000000-0000-0000-0000-000000000001',
        username: 'admin',
        password,
        email: 'admin@acme.com',
        roles: [
            Role.Admin,
            Role.Abteilungsleiter,
            Role.Mitarbeiter,
            Role.Kunde,
        ],
    },
    {
        id: '20000000-0000-0000-0000-000000000002',
        username: 'mitarbeiter',
        password,
        email: 'adriana.alpha@acme.com',
        roles: [Role.Mitarbeiter],
    },
    {
        id: '20000000-0000-0000-0000-000000000003',
        username: 'alfred.alpha',
        password,
        email: 'alfred.alpha@acme.com',
        roles: [Role.Mitarbeiter],
    },
    {
        id: '20000000-0000-0000-0000-000000000004',
        username: 'antonia.alpha',
        password,
        email: 'antonia.alpha@acme.com',
        roles: [Role.Kunde],
    },
    {
        id: '20000000-0000-0000-0000-000000000005',
        username: 'dirk.delta',
        password,
        email: 'dirk.delta@acme.com',
        roles: [Role.Admin],
    },
    {
        id: '20000000-0000-0000-0000-000000000006',
        username: 'emilia.epsilon',
        password,
        email: 'emilia.epsilon@acme.com',
        roles: [Role.Kunde],
    },
];
