/* eslint-disable @typescript-eslint/require-await */
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

import {Injectable, Logger} from '@nestjs/common';
import safeStringify from 'fast-safe-stringify';
import {users} from './users.db';

/**
 * Das Interface `User` beschreibt die Properties zu einer vorhandenen
 * Benutzerkennung.
 */
export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  roles?: string[];
}

/**
 * Die Klasse `UserService` implementiert Funktionen, um Objekte vom Typ
 * {@linkcode User} zu suchen.
 */
@Injectable()
export class UserService {
  readonly #logger = new Logger(UserService.name);

  constructor() {
    this.#logger.log(`users=${safeStringify(users)}`);
  }

  /**
   * Ein {@linkcode User} wird anhand seines Benutzernamens gesucht.
   *
   * @param username Benutzername.
   * @return Ein Objekt vom Typ {@linkcode User}, falls es einen Benutzer
   *  mit dem angegebenen Benutzernamen gibt. Sonst `undefined`.
   */
  async findByUsername(username: string) {
    return users.find((u: User) => u.username === username);
  }

  /**
   * Ein {@linkcode User} wird anhand seiner ID gesucht.
   *
   * @param id ID des gesuchten Benutzers.
   * @return Ein Objekt vom Typ {@linkcode User}, falls es einen Benutzer
   *  mit der angegebenen ID gibt. Sonst `undefined`.
   */
  async findById(id: string|undefined) {
    return users.find((user: User) => user.id === id);
  }

  /**
   * Ein {@linkcode User} wird anhand seiner Emailadresse gesucht.
   *
   * @param email Emailadresse.
   * @return Ein Objekt vom Typ {@linkcode User}, falls es einen Benutzer
   *  mit der angegebenen Emailadresse gibt. Sonst `undefined`.
   */
  async findByEmail(email: string) {
    return users.find((user: User) => user.email === email);
  }
}
/* eslint-enable @typescript-eslint/require-await */
