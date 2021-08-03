// deno-lint-ignore-file

export class SbankenClient {
  #client_id: string;

  constructor(clientId: string) {
    this.#client_id = clientId;
  }

  async authenticate(
    customerId: string,
    password: string,
  ): Promise<AuthenticateResponse> {
    const body = new FormData();
    body.append("grant_type", "client_credentials");
    return (await fetch(
      "https://auth.sbanken.no/identityserver/connect/token",
      {
        method: "POST",
        headers: {
          Authorization: this.authorization(password),
          Accept: "application/json",
          customerId,
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

  async get(endpoint: string, accessToken: string) {
    const resp = await fetch(
      "https://publicapi.sbanken.no/apibeta/api/v1" + endpoint,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );
    const data = await resp.json();
    if (resp.ok) {
      return data;
    }

    throw new Error(data.detail);
  }

  accounts(accessToken: string): Promise<AccountResponse> {
    return this.get(
      "/accounts",
      accessToken,
    );
  }

  transactions(
    accessToken: string,
    id: string,
    options: { archive?: boolean; args?: string } = { archive: true, args: "" },
  ): Promise<TransactionsResponse> {
    let url = "/transactions";
    if (options.archive) {
      url += "/archive";
    }
    url += "/" + id + options.args;

    return this.get(url, accessToken);
  }
}

export interface AuthenticateResponse {
  access_token: string;
  expires_in: 3600;
  token_type: "Bearer";
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
