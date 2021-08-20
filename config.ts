import {
  assert,
  Infer,
  number,
  object,
  optional,
  record,
  string,
} from "https://cdn.skypack.dev/superstruct?dts";

const configSchema = object({
  sbanken: object({
    client_id: string(),
    password: string(),
  }),
  lunchmoney: object({
    access_token: string(),
  }),
  last_sync: optional(record(string(), string())),
  accounts_map: optional(record(string(), number())),
});

export type ConfigSchema = Infer<typeof configSchema>;

async function getConfigPath(): Promise<string> {
  await Deno.permissions.request({ name: "env", variable: "HOME" });
  return Deno.env.get("HOME") + "/.sbanken-lunchmoney.json";
}

async function getConfig(path: string): Promise<ConfigSchema> {
  await Deno.permissions.request({ name: "read", path });
  const config = JSON.parse(await Deno.readTextFile(path));

  try {
    assert(config, configSchema);
    return config;
  } catch (error) {
    console.log(error.message);
    Deno.exit();
  }
}

export { getConfig, getConfigPath };
