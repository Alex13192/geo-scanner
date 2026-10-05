/**
 * Put the real D1 database id into every wrangler config that needs it.
 *
 * WHY THIS EXISTS AS A SCRIPT RATHER THAN TWO MANUAL EDITS. The id has to appear in
 * wrangler.jsonc and in cron/wrangler.jsonc, and they have to be the same value. Getting one
 * of them wrong is the worst kind of mistake this project has: the site writes subscriptions
 * to one database while the weekly runner reads from another, both work perfectly, and the
 * only symptom is that no report ever arrives. Nothing logs an error, because nothing is
 * broken - they are simply two different databases.
 *
 * So the failure this prevents is not "a typo", it is "a silent divergence", and the answer to
 * that is a command that writes both and then proves they agree.
 *
 * USAGE
 *   node scripts/set-d1-id.mjs <uuid>   write this id into both configs
 *   node scripts/set-d1-id.mjs          copy the id from wrangler.jsonc into cron/
 *   node scripts/set-d1-id.mjs --check  report whether the two configs agree
 *
 * Get the id from:
 *   npx wrangler d1 create geo-scanner-subscribers
 * which prints a snippet containing `"database_id": "..."`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAIN = join(ROOT, "wrangler.jsonc");
const CRON = join(ROOT, "cron", "wrangler.jsonc");

const DB_NAME = "geo-scanner-subscribers";

/**
 * Ask wrangler for the id rather than asking the human.
 *
 * Returns null on any failure - not logged in, database absent, wrangler missing, output not
 * JSON - because every one of those has the same next step for the caller, and a stack trace
 * here would be less useful than the sentence the caller prints.
 *
 * The field is `uuid` in current wrangler and `database_id` in older output; both are accepted
 * so this does not become the thing that breaks on an upgrade.
 */
function lookupId() {
  try {
    const raw = execSync("npx wrangler d1 list --json", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    // wrangler can print a banner before the JSON, so start at the first bracket.
    const start = raw.indexOf("[");
    if (start < 0) return null;
    const list = JSON.parse(raw.slice(start));
    const match = list.find((entry) => entry.name === DB_NAME);
    return match ? (match.uuid ?? match.database_id ?? null) : null;
  } catch {
    return null;
  }
}

/** The placeholder both files ship with. Finding it means the resource was never created. */
const PLACEHOLDER = "00000000-0000-0000-0000-000000000000";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read the first database_id in a config, whatever the surrounding formatting. */
function readId(path) {
  const match = readFileSync(path, "utf8").match(/"database_id"\s*:\s*"([^"]*)"/);
  return match ? match[1] : null;
}

/** Replace it in place, keeping every comment and every other byte of the file untouched. */
function writeId(path, id) {
  const before = readFileSync(path, "utf8");
  const after = before.replace(/("database_id"\s*:\s*")[^"]*(")/, `$1${id}$2`);
  if (after === before && !before.includes(id)) {
    throw new Error(`could not find a database_id to replace in ${path}`);
  }
  writeFileSync(path, after);
}

function report(mainId, cronId) {
  const same = mainId && cronId && mainId === cronId;
  console.log(`  wrangler.jsonc       ${mainId ?? "(none found)"}`);
  console.log(`  cron/wrangler.jsonc  ${cronId ?? "(none found)"}`);
  return same;
}

const arg = process.argv[2];
const mainId = readId(MAIN);
const cronId = readId(CRON);

if (arg === "--check") {
  const same = report(mainId, cronId);
  if (same && mainId !== PLACEHOLDER) {
    console.log("\nBoth configs agree and point at a real database.");
    process.exit(0);
  }
  if (same) {
    /*
     * Fails rather than passing. The placeholder is not a wrong value, it is an absent one, and
     * a check that accepts it would go green on a repository that has never been deployed -
     * which is exactly the state it exists to catch.
     */
    console.error("\nBoth configs still hold the placeholder. Nothing is deployed yet.");
    process.exit(1);
  }
  console.error("\nThe two configs DISAGREE. This is the failure that produces no error at runtime.");
  process.exit(1);
}

if (arg) {
  if (!UUID.test(arg)) {
    console.error(`That is not a database id: ${arg}`);
    console.error("It should look like 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d.");
    process.exit(1);
  }
  writeId(MAIN, arg);
  writeId(CRON, arg);
  console.log(`Wrote ${arg} into both configs.\n`);
  report(readId(MAIN), readId(CRON));
  process.exit(0);
}

/*
 * No argument: look the database up, then write it into both configs.
 *
 * WHY THIS ASKS WRANGLER RATHER THAN MAKING THE HUMAN COPY A UUID. The first version of this
 * script required the id as an argument, documented as `<uuid>`, and the very first person to
 * use it typed those six characters literally - which PowerShell rejects outright, because
 * `<` is a reserved redirection operator. A placeholder that looks like a value is a trap, and
 * the fix is not a better placeholder: it is not needing one. `wrangler d1 list --json`
 * already knows the answer.
 *
 * The explicit-argument form above stays, because it is the only one that works before the
 * database exists in a form this can query, and because it is what a script or CI would use.
 */
if (!mainId || mainId === PLACEHOLDER) {
  const found = lookupId();

  if (!found) {
    console.error(
      "No database_id in wrangler.jsonc, and could not find one named " +
        `"${DB_NAME}" via \`wrangler d1 list\`.\n\n` +
        `Create it first:\n  npx wrangler d1 create ${DB_NAME}\n\n` +
        "If it already exists, check that you are logged in with `npx wrangler whoami`."
    );
    process.exit(1);
  }

  writeId(MAIN, found);
  writeId(CRON, found);
  console.log(`Found ${DB_NAME} and wrote its id into both configs.\n`);
  report(readId(MAIN), readId(CRON));
  process.exit(0);
}

writeId(CRON, mainId);
console.log(`Copied ${mainId} from wrangler.jsonc into cron/wrangler.jsonc.\n`);
report(readId(MAIN), readId(CRON));
