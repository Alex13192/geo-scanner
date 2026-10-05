/**
 * Constants shared between the llms.txt generator and the page that describes it.
 *
 * WHY THIS FILE EXISTS FOR ONE NUMBER. app/(en)/llms-txt-studio/page.tsx tells the reader how many
 * links the draft will contain, and the answer is whatever app/api/llms-txt/route.ts caps at. A
 * number written into prose is a second copy of that cap, and the two would drift the first time
 * somebody raised the limit - leaving a page that describes the tool inaccurately, on the page whose
 * whole argument is that it says what it actually does. The page imports this constant instead.
 */
export const MAX_LINKS = 12;
