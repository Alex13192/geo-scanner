-- Step 0 of the subscription work: the weekly report, without accounts or payments.
--
-- WHY THERE IS NO `users` TABLE: the address IS the identity at this stage. An account is
-- a thing to maintain, reset, secure and delete, and none of that is worth building until
-- somebody has demonstrated they want the report at all. Step 1 adds `users` and turns
-- `subscribers` into `monitors`; nothing here has to be thrown away for that to happen,
-- which is the only reason a step-0 schema is worth writing carefully.
--
-- WHY `status` HAS FOUR VALUES AND NOT A BOOLEAN: 'bounced' is not the same as
-- 'unsubscribed'. One is a person who asked to stop and must never be written to again;
-- the other is an address that stopped existing, and a later re-signup should be allowed
-- to clear it. Collapsing them is how a sender ends up either mailing the dead or refusing
-- the living.

CREATE TABLE subscribers (
  -- Random, not autoincrement: the unsubscribe URL carries this id, and a sequential id
  -- would let anyone enumerate the list by counting.
  id            TEXT PRIMARY KEY,
  domain        TEXT NOT NULL,
  email         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
                -- pending | confirmed | unsubscribed | bounced
  confirm_token TEXT NOT NULL,
  unsub_token   TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  confirmed_at  INTEGER,
  -- Denormalised on purpose: the weekly cron reads every confirmed row, and the report
  -- needs the previous score to say what changed. Joining the scans table for one integer
  -- per row would put that join inside a 10 ms budget.
  last_scan_at  INTEGER,
  last_score    INTEGER,
  last_grade    TEXT
);

-- One live subscription per address per domain. Unsubscribed rows are excluded rather than
-- deleted, so the same address can subscribe again without the old row blocking it - and
-- so the record of the withdrawal survives, which is the part a privacy request asks about.
CREATE UNIQUE INDEX subscribers_email_domain_live
  ON subscribers (email, domain) WHERE status != 'unsubscribed';

-- The cron's only query.
CREATE INDEX subscribers_confirmed ON subscribers (status, last_scan_at);

CREATE TABLE scans (
  id               TEXT PRIMARY KEY,
  subscriber_id    TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  at               INTEGER NOT NULL,
  score            INTEGER NOT NULL,
  grade            TEXT NOT NULL,
  checks_passed    INTEGER NOT NULL,
  checks_run       INTEGER NOT NULL,
  -- JSON array of check ids. Stored rather than recomputed so the report can say which
  -- checks are NEW failures since last week, which is the only line most readers will read.
  failed_check_ids TEXT NOT NULL
);

CREATE INDEX scans_subscriber ON scans (subscriber_id, at DESC);
