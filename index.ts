import yargs from "https://deno.land/x/yargs@v17.0.1-deno/deno.ts";

import type { Transaction } from "./sbanken_client.ts";
import { SbankenClient } from "./sbanken_client.ts";

if (import.meta.main) {
  await Promise.all([
    Deno.permissions.request({ name: "net", host: "auth.sbanken.no" }),
    Deno.permissions.request({ name: "net", host: "publicapi.sbanken.no" }),
  ]);

  const config = await getConfig();
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
          { archive: true, args: "" },
        );

        const lmTransactions = transactions.items.filter((t) => t.cardDetails)
          .map(normalizeTransaction);

        const imported: { ids: number[] } =
          await (await fetch(`https://dev.lunchmoney.app/v1/transactions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.lunchmoney_access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactions: lmTransactions,
              debit_as_negative: true,
              check_for_recurring: true,
              skip_duplicates: true,
              apply_rules: true,
            }),
          })).json();

        console.log(
          `${imported.ids.length} transaction(s) imported to Lunch Money`,
        );
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
        const accountOverview = accounts.items.map((account) =>
          `${account.name} (${account.accountId})`
        ).join("\n");
        console.log(accountOverview);
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

function normalizeTransaction(transaction: Transaction) {
  let payee = transaction.cardDetails.merchantName;
  payee = payee.charAt(0).toUpperCase() + payee.slice(1).toLowerCase();
  return {
    date: transaction.cardDetails.purchaseDate,
    amount: transaction.amount,
    payee,
  };
}
