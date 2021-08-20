export class SbankenClient {
  #client_id: string;
  endpoint = "https://publicapi.sbanken.no/apibeta/api/v1";

  constructor(clientId: string) {
    this.#client_id = clientId;
  }

  async authenticate(
    password: string,
  ): Promise<AuthenticateResponse> {
    await Deno.permissions.request({ name: "net", host: "auth.sbanken.no" });

    const body = new FormData();
    body.append("grant_type", "client_credentials");
    return (await fetch(
      "https://auth.sbanken.no/identityserver/connect/token",
      {
        method: "POST",
        headers: {
          Authorization: this.authorization(password),
          Accept: "application/json",
        },
        body,
      },
    )).json();
  }

  authorization(password: string): string {
    const value = `${encodeURIComponent(this.#client_id)}:${
      encodeURIComponent(password)
    }`;
    return "Basic " + btoa(value);
  }

  async get(url: URL, accessToken: string) {
    Deno.permissions.request({ name: "net", host: "publicapi.sbanken.no" });

    const resp = await fetch(url, {
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

  accounts(accessToken: string): Promise<AccountResponse> {
    return this.get(new URL(`${this.endpoint}/accounts`), accessToken);
  }

  transactions(
    accessToken: string,
    id: string,
    options: Record<string, string | null> = {},
  ): Promise<TransactionsResponse> {
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

export interface AuthenticateResponse {
  "access_token": string;
  "expires_in": 3600;
  "token_type": "Bearer";
  scope: string;
}

export interface TransactionsResponse {
  availableItems: number;
  items: Transaction[];
}
export interface AccountResponse {
  availableItems: number;
  items: Account[];
}

export interface Transaction {
  transactionId: string;
  accountingDate: string;
  interestDate: string;
  amount: number;
  text: string;
  transactionType: string;
  transactionTypeCode: number;
  transactionTypeText: string;
  source: number;
  cardDetails?: {
    cardNumber: string;
    currencyAmount: number;
    currencyRate: number;
    merchantCategoryCode: string;
    merchantCategoryDescription: string;
    merchantCity: string;
    merchantName: string;
    originalCurrencyCode: string;
    purchaseDate: string;
    transactionId: string;
  };
  cardDetailsSpecified: true;
}

interface Account {
  accountId: string;
  accountNumber: string;
  ownerCustomerId: string;
  name: string;
  accountType: string;
  available: number;
  balance: number;
  creditLimit: number;
}
