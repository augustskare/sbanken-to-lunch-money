import type { paths, definitions } from "./sbanken";

export interface SbankenAuthenticateResponse {
  access_token: string;
  expires_in: 3600;
  token_type: "Bearer";
  scope: string;
}
export type SbankenAccountResponse = paths["/api/v2/Accounts"]["get"]["responses"]["200"]["schema"];
export type SbankenTransactionsResponse =
  paths["/api/v2/Transactions/archive/{accountId}"]["get"]["responses"]["200"]["schema"];

export type SbankenTransaction = definitions["ArchiveTransaction"];


export class SbankenClient {
  client_id: string;
  endpoint = "https://publicapi.sbanken.no/apibeta/api/v2";

  constructor(clientId: string) {
    this.client_id = clientId;
  }

  async authenticate(password: string): Promise<SbankenAuthenticateResponse> {
    /* @ts-ignore */
    const body = new FormData();
    body.append("grant_type", "client_credentials");
    /* prettier-ignore */ /* @ts-ignore */
    return (await fetch("https://auth.sbanken.no/identityserver/connect/token", {
        method: "POST",
        headers: {
          Authorization: this.authorization(password),
          Accept: "application/json",
        },
        body,
      })
    ).json();
  }

  authorization(password: string): string {
    const value = `${encodeURIComponent(this.client_id)}:${encodeURIComponent(password)}`;
    return "Basic " + Buffer.from(value).toString("base64");
  }

  async get(url: URL, accessToken: string) {
    /* @ts-ignore */
    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const data = await resp.json();
    if (resp.ok) {
      return data;
    }

    throw new Error(data.detail);
  }

  accounts(accessToken: string): Promise<SbankenAccountResponse> {
    return this.get(new URL(`${this.endpoint}/accounts`), accessToken);
  }

  transactions(
    accessToken: string,
    id: string,
    options: Record<string, string | null> = {}
  ): Promise<SbankenTransactionsResponse> {
    const url = new URL(`${this.endpoint}/transactions/archive/${id}`);
    for (const key in options) {
      const value = options[key];
      if (value !== null) {
        url.searchParams.set(key, value);
      }
    }

    return this.get(url, accessToken);
  }
}
