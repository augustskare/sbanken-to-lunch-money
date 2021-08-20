import yargs from "https://deno.land/x/yargs@v17.0.1-deno/deno.ts";

import { getConfig, getConfigPath } from "./config.ts";

import * as sync from "./commands/sync.ts";
import * as accounts from "./commands/accounts.ts";
import * as assets from "./commands/assets.ts";

if (import.meta.main) {
  const configPath = await getConfigPath();
  const config = await getConfig(configPath);

  const args = yargs(Deno.args).help().scriptName("slm")
    .version("1.0.0")
    .command(sync)
    .command(assets)
    .command(accounts)
    .strictCommands()
    .demandCommand(1);

  // @ts-ignore
  args.config({ config }).argv;
}
