import { APIRequestContext } from "@playwright/test";
import { randomUUID } from "crypto";

/** Standard EHR response envelope: { status, data: { messages, result } } */
export interface ApiEnvelope<T> {
    status: string;
    data?: {
        result?: T;
        messages?: unknown[];
    };
}

/** Which screen the request claims to come from; the backend requires this in x-requestargs. */
export interface RequestOrigin {
    module: string;
    route: string;
}

/**
 * Shared plumbing for all backend helpers: auth token, origin headers and the
 * x-requestargs header. The GUID in x-requestargs only needs to be unique, so a fresh
 * one is generated per request instead of replaying a captured value.
 */
export class ApiClient {
    readonly request: APIRequestContext;
    readonly token: string;

    constructor(requestContext: APIRequestContext, liveToken: string) {
        this.request = requestContext;
        this.token = liveToken;
    }

    protected headers(origin: RequestOrigin): Record<string, string> {
        return {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
            'origin': process.env.URL!,
            'referer': `${process.env.URL}/`,
            'x-requestargs': `iemoweb;0.0.1;${origin.module};${randomUUID()};${origin.route}`,
            'x-token': this.token,
        };
    }

    protected async send<T>(
        method: 'GET' | 'POST' | 'DELETE',
        url: string,
        origin: RequestOrigin,
        data?: unknown
    ): Promise<ApiEnvelope<T>> {
        const response = await this.request.fetch(url, { method, headers: this.headers(origin), data });

        if (response.status() !== 200) {
            throw new Error(`${method} ${url} failed! Status: ${response.status()} Body: ${await response.text()}`);
        }

        return await response.json() as ApiEnvelope<T>;
    }

    /** Same as send(), but returns data.result and fails loudly if it is missing. */
    protected async result<T>(
        method: 'GET' | 'POST' | 'DELETE',
        url: string,
        origin: RequestOrigin,
        data?: unknown
    ): Promise<T> {
        const body = await this.send<T>(method, url, origin, data);
        if (body.data?.result === undefined || body.data?.result === null) {
            throw new Error(`${method} ${url} returned no result: ${JSON.stringify(body).slice(0, 500)}`);
        }
        return body.data.result;
    }
}
