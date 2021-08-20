import type { ConfigSchema } from "../config.ts";
import { SbankenClient } from "../sbanken_client.ts";

export const command = "accounts";
export const describe = "List of all available Sbanken accounts";

export async function handler({ config }: { config: ConfigSchema }) {
  const sbanken = new SbankenClient(config.sbanken.client_id);
  const { access_token: accessToken } = await sbanken.authenticate(
    config.sbanken.password,
  );

  const accounts = await sbanken.accounts(accessToken);
  console.log("Sbanken accounts:");
  console.table(accounts.items, ["name", "accountId"]);
}
