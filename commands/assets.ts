import type { ConfigSchema } from "../config.ts";

import { LunchMoneyClient } from "../lunchmoney_client.ts";

export const command = "assets";
export const describe = "List of all available Lunch Money assets";

export async function handler({ config }: { config: ConfigSchema }) {
  const lunchmoney = new LunchMoneyClient(config.lunchmoney.access_token);
  const { assets } = await lunchmoney.assets();
  console.log("Lunch Money assets:");
  console.table(assets, ["name", "display_name", "id"]);
}
