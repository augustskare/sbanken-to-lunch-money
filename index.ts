import yargs from "https://deno.land/x/yargs@v17.0.1-deno/deno.ts";

import type { Transaction } from "./sbanken_client.ts";
import type { Transaction as LMTransactions } from "./lunchmoney_client.ts";
import { SbankenClient } from "./sbanken_client.ts";
import { LunchMoneyClient } from "./lunchmoney_client.ts";

if (import.meta.main) {
  await Promise.all([
    Deno.permissions.request({ name: "net", host: "auth.sbanken.no" }),
    Deno.permissions.request({ name: "net", host: "publicapi.sbanken.no" }),
  ]);

  const config = await getConfig();

  const lunchmoney = new LunchMoneyClient(config.lunchmoney_access_token);

  const args = yargs(Deno.args).help().scriptName("slm")
    .version("1.0.0")
    .command(
      "sync <accountId>",
      "Sync transactions from Sbaken to Lunch Money",
      {},
      async function (argv: any) {
        const sbanken = new SbankenClient(config.sbanken_client_id);
        const { access_token: accessToken } = await sbanken.authenticate(
          config.sbanken_customer_id,
          config.sbanken_password,
        );

        const transactions = await sbanken.transactions(
          accessToken,
          argv.accountId,
          { archive: true, args: `?startDate=${lastSync}` },
        );
        /* asset_id */
        const lmTransactions = transactions.items.map(normalizeTransaction);
        const imported = await lunchmoney.transactions(lmTransactions)
        
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
        const {assets} = await lunchmoney.assets();
        console.log(assets[0])
        console.log("Lunch Money assets:");
        console.table(assets, ["name", "display_name", "id"]);
      },
    )
    .command(
      "accounts",
      "List of all available Sbanken accounts",
      {},
      async function () {
        const sbanken = new SbankenClient(config.sbanken_client_id);
        const { access_token: accessToken } = await sbanken.authenticate(
          config.sbanken_customer_id,
          config.sbanken_password,
        );

        const accounts = await sbanken.accounts(accessToken);
        console.log("Sbanken accounts:")
        console.table(accounts.items, ["name", "accountId"]);
      },
    )
    .strictCommands()
    .demandCommand(1);

  // @ts-ignore
  args.argv;
}

async function getConfig() {
  await Promise.all([
    Deno.permissions.request({ name: "env" }),
    Deno.permissions.request({ name: "read" }),
  ]);

  const configFile = await Deno.readTextFile(
    Deno.env.get("HOME") + "/.sbanken-lunchmoney.config",
  );
  const config: Record<string, string> = {};
  configFile.trim().split("\n").forEach((parts) => {
    const [key, value] = parts.split(":");
    config[key.trim()] = value.trim();
  });

  const requiredKeys = [
    "sbanken_client_id",
    "sbanken_password",
    "sbanken_customer_id",
    "lunchmoney_access_token",
  ];
  [...requiredKeys].forEach((key) => {
    if (key in config) {
      const idx = requiredKeys.findIndex((k) => k === key);
      requiredKeys.splice(idx, 1);
    }
  });
  if (requiredKeys.length) {
    Deno.exit();
  }

  return config as Record<
    | "sbanken_client_id"
    | "sbanken_password"
    | "sbanken_customer_id"
    | "lunchmoney_access_token",
    string
  >;
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
