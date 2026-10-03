/**
 * The operator's identity, as it must appear where a notice has to name who it
 * is addressed to. Today that is the withdrawal notice at /withdrawal/.
 *
 * WHAT IS DELIBERATELY NOT IN THIS FILE: the postal address.
 *
 * It was published while the German Impressum existed, because section 5 DDG
 * requires a serviceable address. The German pages were removed and the address
 * has been taken out of the source, for two reasons:
 *
 *   1. A withdrawal can be declared by email, and naming the operator plus an
 *      email address is enough for a consumer to act on.
 *   2. THIS REPOSITORY IS PUBLIC. Anything committed here is published whether or
 *      not a page renders it, and a git history cannot be unpublished by editing
 *      a file. An operator's home address does not belong in it.
 *
 * If a market is added later that legally requires a postal address - an
 * Impressum does - then the address has to live somewhere, and this file is the
 * right somewhere. Make the repository private first. A page can be changed in a
 * minute; a commit is forever.
 */
export const LEGAL_NAME_LATIN = "Xiaodong Xu";
export const LEGAL_NAME_NATIVE = "徐晓东";
