export class LunchMoneyClient {
  #accessToken: string;
  baseUrl = "https://dev.lunchmoney.app/v1";

  constructor(accessToken: string) {
    this.#accessToken = accessToken;
  }

  async transactions(
    transactions: Transaction[],
    options?: TransactionOptions,
  ): Promise<{ ids: number[] }> {
    return (await fetch(`${this.baseUrl}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.#accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactions,
        ...{
          debit_as_negative: true,
          check_for_recurring: true,
          skip_duplicates: true,
          apply_rules: true,
          ...options || {},
        },
      }),
    })).json();
  }

  async assets(): Promise<Assets> {
    return (await fetch(`${this.baseUrl}/assets`, {
      headers: {
        "Authorization": `Bearer ${this.#accessToken}`,
        "Content-Type": "application/json",
      },
    })).json();
  }
}

export interface Transaction {
  date: string;
  amount: string | number;
  category_id?: number;
  payee?: string;
  currency?: string;
  asset_id?: number;
  recurring_id?: number;
  notes?: string;
  status?: string;
  external_id?: string;
}

interface TransactionOptions {
  debit_as_negative: boolean;
  check_for_recurring: boolean;
  skip_duplicates: boolean;
  apply_rules: boolean;
}

interface Assets {
  assets: {
    id: number;
    type_name: string;
    subtype_name: string;
    name: string;
    display_name?: string;
    balance: number;
    balance_as_of: string;
    currency: string;
    closed_on?: string;
    institution_name: string;
    created_as: string;
  }[];
}
