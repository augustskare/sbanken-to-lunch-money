import {
  assert,
  Infer,
  object,
  optional,
  size,
  string,
} from "https://cdn.skypack.dev/superstruct?dts";

const configSchema = object({
  sbanken: object({
    client_id: string(),
    password: string(),
    customer_id: size(string(), 11),
  }),
  lunchmoney: object({
    access_token: string(),
  }),
  last_sync: optional(string()),
});

async function getConfigPath(): Promise<string> {
  await Deno.permissions.request({ name: "env", variable: "HOME" });
  return Deno.env.get("HOME") + "/.sbanken-lunchmoney.json";
}

async function getConfig(path: string): Promise<Infer<typeof configSchema>> {
  await Deno.permissions.request({ name: "read", path });
  const config = JSON.parse(await Deno.readTextFile(path));

  try {
    assert(config, configSchema);
    return config;
  } catch (error) {
    console.log(error);
    Deno.exit();
  }
}

async function updateSyncDate(path: string, date: string): Promise<void> {
  await Promise.all([
    Deno.permissions.request({ name: "read", path }),
    Deno.permissions.request({ name: "write", path }),
  ]);

  const config = JSON.parse(await Deno.readTextFile(path));
  config.last_sync = date.split("T")[0];
  await Deno.writeTextFile(path, JSON.stringify(config));
}

export { getConfig, getConfigPath, updateSyncDate };
