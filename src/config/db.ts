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
 * Das Modul enthält die Konfiguration für den Zugriff auf MongoDB.
 * @packageDocumentation
 */

import { env } from './env';
import { k8sConfig } from './kubernetes';

const { dbConfigEnv } = env;

// nullish coalescing
const dbName = dbConfigEnv.name ?? 'acme';
const { detected } = k8sConfig;
const host = detected ? 'mongodb' : dbConfigEnv.host ?? 'localhost';
const atlas = host.endsWith('mongodb.net');
const port = 27_017;
const user = dbConfigEnv.user ?? 'admin';
const pass = dbConfigEnv.password ?? 'p';
const autoIndex =
    dbConfigEnv.autoIndex === 'true' || dbConfigEnv.autoIndex === 'TRUE';
const dbPopulate =
    dbConfigEnv.populate === 'true' || dbConfigEnv.populate === 'TRUE';
const dbPopulateFiles =
    dbConfigEnv.populateFiles === 'true' ||
    dbConfigEnv.populateFiles === 'TRUE';

let url: string;
let adminUrl: string;

if (atlas) {
    // https://docs.mongodb.com/manual/reference/connection-string
    // Default:
    //  retryWrites=true            ab MongoDB-Treiber 4.2
    //  readPreference=primary
    // "mongodb+srv://" statt "mongodb://" fuer eine "DNS seedlist" z.B. bei "Replica Set"
    // https://docs.mongodb.com/manual/reference/write-concern
    url = `mongodb+srv://${user}:${pass}@${host}/${dbName}?replicaSet=Cluster0-shard-0&w=majority`;
    adminUrl = `mongodb+srv://${user}:${pass}@${host}/admin?w=majority`;
} else {
    url = `mongodb://${user}:${pass}@${host}/${dbName}?authSource=admin`;
    adminUrl = `mongodb://${user}:${pass}@${host}/admin`;
}

interface DbConfig {
    readonly atlas: boolean;
    readonly url: string;
    readonly adminUrl: string;
    readonly dbName: string;
    readonly host: string;
    readonly port: number;
    readonly user: string;
    readonly pass: string;
    readonly autoIndex: boolean;
    readonly dbPopulate: boolean;
    readonly dbPopulateFiles: boolean;
}

/**
 * Das Konfigurationsobjekt für den Zugriff auf MongoDB.
 */
export const dbConfig: DbConfig = {
    atlas,
    url,
    adminUrl,
    dbName,
    host,
    port,
    user,
    pass,
    autoIndex,
    dbPopulate,
    dbPopulateFiles,
};

const dbConfigLog = {
    atlas,
    url: url.replace(/\/\/.*:/u, '//USERNAME:@').replace(/:[^:]*@/u, ':***@'),
    adminUrl: adminUrl
        .replace(/\/\/.*:/u, '//USERNAME:@')
        .replace(/:[^:]*@/u, ':***@'),
    dbName,
    host,
    port,
    autoIndex,
    dbPopulate,
    dbPopulateFiles,
};

console.info('dbConfig: %o', dbConfigLog);
