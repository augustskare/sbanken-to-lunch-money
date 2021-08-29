# Sbanken to Lunch Money

Synchronize transactions from Sbanken to Lunch Money

## Usage

| Commands                | desc                                         |
| ----------------------- | -------------------------------------------- |
| slm sync <accountId...> | Sync transactions from Sbaken to Lunch Money |
| slm assets              | List of all available Lunch Money assets     |
| slm accounts            | List of all available Sbanken accounts       |

## Installation

Make sure to have [Deno installed](https://deno.land/manual@v1.13.0/getting_started/installation) before continuing.

To install the script with the correct permissions, run: `deno install --allow-net --allow-read --allow-env --location https://slm.test --name slm  https://raw.githubusercontent.com/augustskare/sbanken-to-lunch-money/main/mod.ts`

### Configuration

The configuration file should be placed in your home directory, named
`.sbanken-lunchmoney.json` (`~/.sbanken-lunchmoney.json`). Get your Lunch money
access token on the
[developers page in the Lunch Money app](https://my.lunchmoney.app/developers),
and Sbanken client id and password in there
[developer portal](https://utvikler.sbanken.no/).

`accounts_map` is optional, but let's you automaticly match Sbanken accounts
with your assets in Lunch Money.

#### Example configuration file

```json
{
  "sbanken": {
    "client_id": "xxx",
    "password": "xxx"
  },
  "lunchmoney": {
    "access_token": "xxx"
  },
  "accounts_map": {
    "sbanken account id": "lunch money asset id"
  }
}
```

### Permissions

Permissions needed to run the script 
| name  | reason | 
|-------| ------ | 
| net   | access Sbanken and Lunch Money api's | 
| read  | read configuration file | 
| env   | get home directory path |

