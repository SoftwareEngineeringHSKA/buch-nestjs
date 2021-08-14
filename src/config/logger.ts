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

import { Cloud, cloud } from './cloud';

import type { Format } from 'logform';
import JSON5 from 'json5';
import { env } from './env';
import { k8sConfig } from './kubernetes';
import { resolve } from 'path';
import winston from 'winston';

const { logConfigEnv, nodeConfigEnv } = env;

/**
 * Das Modul enthält die Konfiguration für den Logger mit _Winston_ sowie
 * die Request-Protokollierung mit _Morgan_.
 * @packageDocumentation
 */

// Winston: seit 2010 bei GoDaddy (Registrierung von Domains)
// Log-Levels: error, warn, info, debug, verbose, silly, ...
// Medien (= Transports): Console, File, ...
// https://github.com/winstonjs/winston/blob/master/docs/transports.md
// Alternative: Pino, log4js, Bunyan

// nullish coalescing
const logLevelConsole = logConfigEnv.logLevelConsole ?? 'info';
const { logDir, colorConsole, logLevelFile } = logConfigEnv;

const logColorConsole =
    colorConsole === undefined ||
    (colorConsole !== 'false' && colorConsole !== 'FALSE'); // eslint-disable-line @typescript-eslint/no-extra-parens

const { format } = winston;
const { colorize, combine, json, simple, splat, timestamp } = format;

const loglevelConsoleDev = cloud === undefined ? logLevelConsole : 'debug';
const consoleFormat =
    cloud !== undefined || !logColorConsole
        ? combine(splat(), simple())
        : combine(splat(), colorize(), simple());
const { nodeEnv } = nodeConfigEnv;
const production = nodeEnv === 'production' || nodeEnv === 'PRODUCTION';

interface ConsoleOptions {
    readonly level: string;
    readonly format: Format;
}

const consoleOptions: ConsoleOptions = {
    level: production && cloud !== Cloud.HEROKU ? 'warn' : loglevelConsoleDev,
    format: consoleFormat,
};
console.log(`Log-Optionen fuer Konsole: ${JSON5.stringify(consoleOptions)}`); // eslint-disable-line security-node/detect-crlf

interface FileOptions {
    readonly filename: string;
    readonly level: string;
    readonly maxsize: number;
    readonly maxFiles: number;
    readonly format: Format;
}

let dir: string;
if (logDir === undefined) {
    const { detected } = k8sConfig;
    dir = detected ? '/tmp' : './log';
} else {
    dir = logDir;
}
let logLevel: string;
if (logLevelFile === undefined) {
    logLevel = production ? 'info' : 'debug';
} else {
    logLevel = logLevelFile;
}
const fileOptions: FileOptions = {
    filename: resolve(dir, 'server.log'),
    level: logLevel,
    // in Bytes
    maxsize: 250_000_000,
    maxFiles: 3,
    format: combine(splat(), timestamp(), json()),
};
console.log(`Log-Optionen fuer Logdatei: ${JSON5.stringify(fileOptions)}`); // eslint-disable-line security-node/detect-crlf

// Formatierung, wenn mit _Morgan_ die Requests protokolliert werden.
// `dev`, wenn in der Konsole die Winston-Ausgaben farbig dargestellt werden.
// Sonst `short`.
const morganFormat = logColorConsole ? 'dev' : 'short';

interface LoggerConfig {
    readonly logColorConsole: boolean;
    readonly consoleOptions: ConsoleOptions;
    readonly fileOptions: FileOptions;
    readonly morganFormat: string;
}

/**
 * Konfiguration des Loggings: Console und Protokolldatei.
 */
export const loggerConfig: LoggerConfig = {
    logColorConsole,
    consoleOptions,
    fileOptions,
    morganFormat,
};
