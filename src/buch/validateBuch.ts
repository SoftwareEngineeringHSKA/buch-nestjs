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

// https://json-schema.org/implementations.html

/**
 * Das Modul besteht aus der Funktion {@linkcode validateBuch} sowie
 * notwendigen Konstanten.
 * @packageDocumentation
 */

// https://ajv.js.org/guide/schema-language.html#draft-2019-09-and-draft-2012-12
// https://github.com/ajv-validator/ajv/blob/master/docs/validation.md
import Ajv2020 from 'ajv/dist/2020';
import type { Buch } from './buch';
import type { FormatValidator } from 'ajv/dist/types';
import { Logger } from '@nestjs/common';
import ajvErrors from 'ajv-errors';
import formatsPlugin from 'ajv-formats';
import safeStringify from 'fast-safe-stringify';
import { jsonSchema } from './jsonSchema';

const ajv = new Ajv2020({
    allowUnionTypes: true,
    allErrors: true,
});
// https://github.com/ajv-validator/ajv-formats#formats
formatsPlugin(ajv, ['date', 'email', 'uri', 'uuid']);
ajvErrors(ajv);

const checkChars = (chars: string[]) => {
    /* eslint-disable @typescript-eslint/no-magic-numbers, unicorn/no-for-loop,
     * security/detect-object-injection */
    let sum = 0;
    let check: number | string;

    if (chars.length === 9) {
        // Compute the ISBN-10 check digit
        chars.reverse();
        for (let i = 0; i < chars.length; i++) {
            sum += (i + 2) * Number.parseInt(chars[i] ?? '', 10);
        }
        check = 11 - (sum % 11); // eslint-disable-line @typescript-eslint/no-extra-parens
        if (check === 10) {
            check = 'X';
        } else if (check === 11) {
            check = '0';
        }
    } else {
        // Compute the ISBN-13 check digit
        for (let i = 0; i < chars.length; i++) {
            sum += ((i % 2) * 2 + 1) * Number.parseInt(chars[i] ?? '', 10); // eslint-disable-line @typescript-eslint/no-extra-parens
        }
        check = 10 - (sum % 10); // eslint-disable-line @typescript-eslint/no-extra-parens
        if (check === 10) {
            check = '0';
        }
    }
    return check;
    /* eslint-enable @typescript-eslint/no-magic-numbers, unicorn/no-for-loop,
     * security/detect-object-injection */
};

// https://github.com/ajv-validator/ajv-formats/issues/14#issuecomment-826340298
const validateISBN: FormatValidator<string> = (subject: string) => {
    // Checks for ISBN-10 or ISBN-13 format
    // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
    const regex =
        /^(?:ISBN(?:-1[03])?:? )?(?=[\dX]{10}$|(?=(?:\d+[- ]){3})[- \dX]{13}$|97[89]\d{10}$|(?=(?:\d+[- ]){4})[- \d]{17}$)(?:97[89][- ]?)?\d{1,5}[- ]?\d+[- ]?\d+[- ]?[\dX]$/u; // eslint-disable-line max-len, unicorn/no-unsafe-regex, security/detect-unsafe-regex

    if (regex.test(subject)) {
        // Remove non ISBN digits, then split into an array
        const chars = subject
            .replace(/[ -]|^ISBN(?:-1[03])?:?/gu, '')
            .split('');
        // Remove the final ISBN digit from `chars`, and assign it to `last`
        const last = chars.pop();

        const check = checkChars(chars);

        // eslint-disable-next-line eqeqeq
        if (check == last) {
            return true;
        }
    }

    return false;
};
ajv.addFormat('ISBN', { type: 'string', validate: validateISBN });

const logger = new Logger('validateBuch');

/**
 * Funktion zur Validierung, wenn neue Bücher angelegt oder vorhandene Bücher
 * aktualisiert bzw. überschrieben werden sollen.
 */
export const validateBuch = (buch: Buch) => {
    const validate = ajv.compile<Buch>(jsonSchema);
    validate(buch);
    // nullish coalescing
    const errors = validate.errors ?? [];
    const messages = errors
        .map((error) => error.message)
        .filter((msg) => msg !== undefined);
    logger.debug(
        `validateBuch: errors=${safeStringify(
            errors,
        )}, messages=${safeStringify(messages)}`,
    );
    return messages as string[];
};
