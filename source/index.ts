import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import type { DraftTransaction } from "lunch-money";
import type { SbankenTransaction } from "./sbanken-client";

import { SbankenClient } from "./sbanken-client";
import { LunchMoneyClient } from "./lunchmoney_client";

function log(condition: boolean, msg: any) {
  if (condition) {
    console.log(msg);
  }
}

const logger = {
  info: (msg: any) => log(true, msg),
  debug: (msg: any) => log(true, msg),
};

const prisma = new PrismaClient();

(async () => {
  const accounts = await prisma.account.findMany();
  const lunchMoney = new LunchMoneyClient(process.env.LM_ACCESS_TOKEN);

  const sbanken = new SbankenClient(process.env.SBANKEN_CLIENT_ID);
  const { access_token } = await sbanken.authenticate(process.env.SBANKEN_PASSWORD);

  let importCount = 0;
  for await (const account of accounts) {
    const { items } = await sbanken.transactions(access_token, account.id, {
      startDate: account.syncedAt.toISOString(),
    });

    let imported = 0;
    if (items && items.length) {
      const transactions = items.map((transaction) => normalizeTransaction(transaction, account.lm_asset || undefined));

      try {
        const response = await lunchMoney.transactions(transactions);

        await prisma.account.update({
          where: { id: account.id },
          data: {
            syncedAt: new Date(transactions[0].date),
          },
        });
        imported = response.ids.length;
        importCount = importCount + imported;
      } catch (error) {
        logger.debug(error);
        logger.debug(`Error importing for account ${account.id}`);
      }
    }

    logger.debug(`${imported} transaction(s) imported to Lunch Money from ${account.id}`);
  }

  logger.info(`Imported ${importCount} transaction(s) to Lunch Money`);
})();

function normalizeTransaction(transaction: SbankenTransaction, assetId?: number): DraftTransaction {
  let date = transaction.accountingDate;
  let payee = transaction.text || "Unknown payee";

  if (transaction.cardDetails !== undefined) {
    date = transaction.cardDetails.purchaseDate;
    payee = transaction.cardDetails.merchantName || payee;
    payee = payee.charAt(0).toUpperCase() + payee.slice(1).toLowerCase();
  }

  return {
    date,
    payee,
    amount: transaction.amount.toString(),
    asset_id: assetId,
    currency: "nok",
    notes: "",
    status: "uncleared",
  };
}
