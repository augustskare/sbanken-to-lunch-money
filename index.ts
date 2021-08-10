import yargs from "https://deno.land/x/yargs@v17.0.1-deno/deno.ts";
import type { Arguments } from "https://deno.land/x/yargs/deno-types.ts";

import { getConfig, getConfigPath, updateSyncDate } from "./config.ts";
import { SbankenClient } from "./sbanken_client.ts";
import { LunchMoneyClient } from "./lunchmoney_client.ts";

import type { Transaction } from "./sbanken_client.ts";
import type { Transaction as LMTransactions } from "./lunchmoney_client.ts";

interface SyncArguments extends Arguments {
  accountId: string[];
}

if (import.meta.main) {
  const configPath = await getConfigPath();
  const config = await getConfig(configPath);

  const lunchmoney = new LunchMoneyClient(config.lunchmoney.access_token);

  const args = yargs(Deno.args).help().scriptName("slm")
    .version("1.0.0")
    .command(
      "sync <accountId...>",
      "Sync transactions from Sbaken to Lunch Money",
      {},
      async function (argv: SyncArguments) {
        const sbanken = new SbankenClient(config.sbanken.client_id);
        const { access_token: accessToken } = await sbanken.authenticate(
          config.sbanken.customer_id,
          config.sbanken.password,
        );

        let transactions: LMTransactions[] = [];
        for await (const account of argv.accountId) {
          const { items } = await sbanken.transactions(accessToken, account, {
            startDate: config.last_sync?.[account],
          });
          const LMTransactions = items.map((transaction) =>
            normalizeTransaction(transaction)
          );
          transactions = transactions.concat(LMTransactions);
          await updateSyncDate(configPath, account, LMTransactions[0].date);
        }

        const imported = await lunchmoney.transactions(transactions);
        console.log(
          `${imported.ids.length} transaction(s) imported to Lunch Money`,
        );
      },
    )
    .command(
      "assets",
      "List of all available Lunch Money assets",
      {},
      async function () {
        const { assets } = await lunchmoney.assets();
        console.log("Lunch Money assets:");
        console.table(assets, ["name", "display_name", "id"]);
      },
    )
    .command(
      "accounts",
      "List of all available Sbanken accounts",
      {},
      async function () {
        const sbanken = new SbankenClient(config.sbanken.client_id);
        const { access_token: accessToken } = await sbanken.authenticate(
          config.sbanken.customer_id,
          config.sbanken.password,
        );

        const accounts = await sbanken.accounts(accessToken);
        console.log("Sbanken accounts:");
        console.table(accounts.items, ["name", "accountId"]);
      },
    )
    .strictCommands()
    .demandCommand(1);

  // @ts-ignore
  args.argv;
}


function normalizeTransaction(transaction: Transaction): LMTransactions {
  if (transaction.cardDetails === undefined) {
    return {
      date: transaction.accountingDate,
      amount: transaction.amount,
      payee: transaction.text,
    };
  }
  let payee = transaction.cardDetails.merchantName;
  payee = payee.charAt(0).toUpperCase() + payee.slice(1).toLowerCase();
  return {
    date: transaction.cardDetails.purchaseDate,
    amount: transaction.amount,
    payee,
  };
}
