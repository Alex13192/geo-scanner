import { CONTACT_EMAIL, OPERATOR_IDENTITY } from "@/lib/site";

/**
 * The seller's identity, rendered the same way everywhere a buyer is asked to trust the site with
 * money.
 *
 * WHY THIS IS A COMPONENT: /pricing/ and /refund/ both have to answer "who am I paying", and they
 * are read at different moments - one while deciding, one after something has gone wrong. Two
 * copies of the same conditional is how the two documents start disagreeing about whether an
 * address is published, and the disagreement would be invisible: both pages would still render.
 *
 * WHY THE PAGES THAT RENDER THIS ARE DYNAMIC: OPERATOR_IDENTITY comes from the deployment
 * environment, and a prerendered page would read it once, at build time. The build has no value,
 * so the fallback sentence would be baked into a static file where no later deploy could replace
 * it - the silent absence /refund/ records at length. /refund/ and /pricing/ both export
 * `dynamic = "force-dynamic"` so this reads the Worker's environment per request instead.
 *
 * WHY THERE IS A FALLBACK AT ALL: this repository is public, so a postal address committed here is
 * published whether or not a page renders it. Saying where the identity is given is the truthful
 * alternative to printing a blank line or inventing an address.
 */
export default function SellerIdentity() {
  if (!OPERATOR_IDENTITY) {
    return (
      <p>
        The seller&rsquo;s name and postal address are given with every quote and invoice, and by
        email on request: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    );
  }

  return <p>{OPERATOR_IDENTITY}</p>;
}
