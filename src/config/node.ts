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
 * Das Modul enthält die Konfiguration für den _Node_-basierten Server.
 * @packageDocumentation
 */

import { Cloud, cloud } from './cloud';
import { env } from './env';
import { hostname } from 'os';
import ip from 'ip';
import { k8sConfig } from './kubernetes';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const { nodeConfigEnv } = env;

const computername = hostname();
const ipAddress = ip.address();

let port = Number.NaN;
const portStr = nodeConfigEnv.serverPort;
if (portStr !== undefined) {
    port = Number.parseInt(portStr, 10);
}
if (Number.isNaN(port)) {
    // SERVER_PORT ist zwar gesetzt, aber keine Zahl
    // https://devcenter.heroku.com/articles/runtime-principles#web-servers
    if (cloud === undefined || cloud === Cloud.OPENSHIFT) {
        port = 3000; // eslint-disable-line @typescript-eslint/no-magic-numbers
    } else {
        // Heroku
        if (nodeConfigEnv.port === undefined) {
            process.exit(0); // eslint-disable-line no-process-exit,node/no-process-exit
        }
        port = Number.parseInt(nodeConfigEnv.port, 10);
    }
}

// https://nodejs.org/api/fs.html
// https://nodejs.org/api/path.html
// http://2ality.com/2017/11/import-meta.html
const usePKI = cloud === undefined && (!k8sConfig.detected || k8sConfig.tls);
const srcDir = k8sConfig.detected ? resolve('dist', 'src') : 'src';
export const configDir = resolve(srcDir, 'config');
const key = usePKI ? readFileSync(resolve(configDir, 'key.pem')) : undefined;
const cert = usePKI
    ? readFileSync(resolve(configDir, 'certificate.cer'))
    : undefined;

const { nodeEnv, serviceHost, servicePort } = nodeConfigEnv;

interface NodeConfig {
    readonly host: string;
    readonly port: number;
    readonly ip: string;
    readonly srcDir: string;
    readonly configDir: string;
    readonly key: Buffer | undefined;
    readonly cert: Buffer | undefined;
    readonly nodeEnv: string | undefined;
    readonly serviceHost: string | undefined;
    readonly servicePort: string | undefined;
}

/**
 * Die Konfiguration für den _Node_-basierten Server:
 * - Rechnername
 * - IP-Adresse
 * - Port
 * - `PEM`- und Zertifikat-Datei mit dem öffentlichen und privaten Schlüssel
 *   für TLS
 */
export const nodeConfig: NodeConfig = {
    host: computername,
    port,
    ip: ipAddress,
    srcDir,
    configDir,
    key,
    cert,
    nodeEnv,
    serviceHost,
    servicePort,
};

const logNodeConfig: Record<string, unknown> = {
    host: computername,
    port,
    ip: ipAddress,
    srcDir,
    configDir,
    nodeEnv,
};
console.info('nodeConfig: %o', logNodeConfig);
