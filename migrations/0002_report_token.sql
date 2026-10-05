-- A capability token for a report page somebody can forward.
--
-- DEPLOY ORDER, BECAUSE NOTHING ENFORCES IT AND THE FAILURE IS NOT LOCAL. Three paths read this
-- column: the subscribe endpoint (the INSERT that follows), the confirmation and unsubscribe
-- routes (they share COLUMNS in lib/db/subscribers.ts), and the weekly runner. Deploying the code
-- before this migration has run gives `no such column: report_token` on all three - the signup form
-- fails and the weekly report stops for every subscriber. There is no migration step in
-- .github/workflows/deploy.yml, so the remote database has to be brought up first:
--
--     npx wrangler d1 migrations apply DB --remote
--
-- and only then the code that needs it. Once per environment, before the deploy, and the deploy is
-- safe; the other order leaves the site broken until somebody notices that nobody can sign up.
--
-- WHY THIS IS NOT unsub_token, WHICH IS THE OBVIOUS REUSE AND THE WRONG ONE. The unsubscribe
-- endpoint acts on a GET, because that is what a link in an email is. Putting that token in a URL
-- that gets forwarded therefore means the first person to open the link stops the subscriber's
-- reports - silently, and with no way back except signing up again. One secret that both reads
-- data and destroys a subscription is a secret that will eventually be forwarded.
--
-- WHY IT IS NOT confirm_token EITHER: that one is consumed and left in place, and a report link
-- has to keep working every week.
--
-- UNIQUE, and NULL is allowed so the column can be added to a table that already has rows: SQLite
-- treats NULLs as distinct, so the index does not collide while old rows are backfilled below.
ALTER TABLE subscribers ADD COLUMN report_token TEXT;

CREATE UNIQUE INDEX subscribers_report_token ON subscribers (report_token);

-- Backfill so an address that subscribed before this migration gets a working link on its next
-- report rather than one that silently does not resolve. randomblob is SQLite's own source of
-- randomness; 16 bytes is the same length as the other tokens in this table.
UPDATE subscribers
   SET report_token = lower(hex(randomblob(16)))
 WHERE report_token IS NULL;
