import type { Arguments } from "https://deno.land/x/yargs@v17.0.1-deno/deno-types.ts";
import type { ConfigSchema } from "../config.ts";
import type { Transaction } from "../sbanken_client.ts";
import type { Transaction as LMTransactions } from "../lunchmoney_client.ts";

import { LunchMoneyClient } from "../lunchmoney_client.ts";
import { SbankenClient } from "../sbanken_client.ts";
interface SyncArguments extends Arguments {
  accountId: string[];
  config: ConfigSchema;
}

export const command = "sync <accountId...>";
export const describe = "Sync transactions from Sbaken to Lunch Money";

export async function handler(
  { config, accountId }: SyncArguments,
) {
  const lunchmoney = new LunchMoneyClient(config.lunchmoney.access_token);
  const sbanken = new SbankenClient(config.sbanken.client_id);
  const { access_token: accessToken } = await sbanken.authenticate(
    config.sbanken.password,
  );

  let transactions: LMTransactions[] = [];
  for await (const account of accountId) {
    const { items } = await sbanken.transactions(accessToken, account, {
      startDate: localStorage.getItem(account),
    });
    const LMTransactions = items.map((transaction) =>
      normalizeTransaction(transaction, config.accounts_map?.[account])
    );
    transactions = transactions.concat(LMTransactions);
    localStorage.setItem(account, LMTransactions[0].date);
  }

  const imported = await lunchmoney.transactions(transactions);
  console.log(
    `${imported.ids.length} transaction(s) imported to Lunch Money`,
  );
}

function normalizeTransaction(
  transaction: Transaction,
  assetId?: number,
): LMTransactions {
  if (transaction.cardDetails === undefined) {
    return {
      date: transaction.accountingDate,
      amount: transaction.amount,
      payee: transaction.text,
      asset_id: assetId,
    };
  }
  let payee = transaction.cardDetails.merchantName;
  payee = payee.charAt(0).toUpperCase() + payee.slice(1).toLowerCase();
  return {
    date: transaction.cardDetails.purchaseDate,
    amount: transaction.amount,
    payee,
    asset_id: assetId,
  };
}
