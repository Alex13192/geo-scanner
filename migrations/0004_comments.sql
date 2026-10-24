-- Comments: anonymous, but published only after the author confirms an email link.
--
-- WHY NO ACCOUNT AND NO MODERATION QUEUE: the site has no login system and the operator has no
-- time to review a queue. Email confirmation is the spam gate that costs no human time: a
-- bot that cannot receive mail cannot publish, and a real reader publishes their own comment
-- with one click. Nothing is shown until that click.
--
-- WHY THE EMAIL IS NOT STORED: it is used once, to send the confirmation link. Storing it would
-- turn a comment box into a second mailing list nobody asked to join. Only a hash is kept, so
-- duplicate-submission checks are possible without keeping the address.
--
-- status: 'pending' -> 'confirmed' on the link; 'hidden' when enough readers report it.
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirm_token TEXT NOT NULL UNIQUE,
  email_hash TEXT NOT NULL,
  reports INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_comments_path ON comments (path, status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_token ON comments (confirm_token);
