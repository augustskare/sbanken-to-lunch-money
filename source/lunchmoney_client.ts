import type { DraftTransaction, Asset } from "lunch-money";

export class LunchMoneyClient {
  accessToken: string;
  baseUrl = "https://dev.lunchmoney.app/v1";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async transactions(transactions: DraftTransaction[], options?: TransactionOptions): Promise<{ ids: number[] }> {
    /* prettier-ignore */ /* @ts-ignore */
    return (await fetch(`${this.baseUrl}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions,
          ...{
            debit_as_negative: true,
            check_for_recurring: true,
            skip_duplicates: true,
            apply_rules: true,
            ...(options || {}),
          },
        }),
      })
    ).json();
  }

  async assets(): Promise<{ assets: Asset[] }> {
    /* prettier-ignore */ /* @ts-ignore */
    return (await fetch(`${this.baseUrl}/assets`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      })
    ).json();
  }
}

interface TransactionOptions {
  debit_as_negative: boolean;
  check_for_recurring: boolean;
  skip_duplicates: boolean;
  apply_rules: boolean;
}
