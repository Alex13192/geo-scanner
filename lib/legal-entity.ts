import { CONTACT_EMAIL } from "@/lib/site";

/**
 * The operator's details, as they must appear in a German Impressum.
 *
 * WHY THIS IS ONE MODULE: § 5 DDG requires the Impressum to name the person
 * responsible, and the Widerrufsbelehrung must name the same person at the same
 * address for a withdrawal to be deliverable. A mismatch between the two is
 * precisely the kind of internal inconsistency that a warning letter
 * (Abmahnung) is built on, so both pages read from here.
 *
 * The operator is a natural person, not a company, so there is no register
 * number, no managing director and - as confirmed - no phone number and no VAT
 * identification number. § 5 DDG requires an email address for rapid electronic
 * contact, which is what CONTACT_EMAIL provides.
 *
 * PRIVACY NOTE: this address is published to the open web and will be indexed
 * permanently. That is what the law asks for in exchange for trading in Germany.
 * A business or mailbox address is the usual way to avoid publishing a private
 * one; if that changes, only this file changes.
 */
export const LEGAL_NAME_LATIN = "Xiaodong Xu";
export const LEGAL_NAME_NATIVE = "徐晓东";

/**
 * The address in the order an international letter expects, which is also the
 * order a German reader expects. Country last, in full, because "China" alone
 * on a letter is not enough to route it.
 */
export const LEGAL_ADDRESS_LINES = [
  "[operator postal address removed from history]",
  "[operator postal address removed from history]",
  "[operator postal address removed from history]",
  "[operator postal address removed from history]",
];

/**
 * The same address written the way it is written in China. Latin-only
 * transliterations are frequently undeliverable there, so the Impressum prints
 * both rather than choosing.
 */
export const LEGAL_ADDRESS_NATIVE =
  "[operator postal address removed from history]";

export const LEGAL_COUNTRY = "[operator postal address removed from history]";

export { CONTACT_EMAIL };
