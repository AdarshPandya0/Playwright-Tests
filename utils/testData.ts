import fs from 'fs';
import path from 'path';

/**
 * Per-environment reference data, picked by the same ENV switch as .env/.env.<ENV>.
 * Holds only human-readable names; IDs are resolved from the backend at runtime (see LookupAPI).
 */
export interface EnvTestData {
    facility: string;
    provider: { firstName: string; lastName: string };
    visitType: string;
}

export const ENV_NAME = process.env.ENV || 'local';

export const envData: EnvTestData = JSON.parse(
    fs.readFileSync(path.resolve(`data/env/${ENV_NAME}.json`), 'utf-8')
);

/** Number of EHR_USERNAME_n accounts configured for this environment (1..n, no gaps). */
export function configuredAccountCount(): number {
    let n = 0;
    while (process.env[`EHR_USERNAME_${n + 1}`]) n++;
    return n;
}
