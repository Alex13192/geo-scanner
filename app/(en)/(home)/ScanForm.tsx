"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

/**
 * The scan box, extracted so the hero and the closing call to action cannot
 * drift apart.
 *
 * WHY IT IS ITS OWN FILE: the homepage is otherwise a server component, and the
 * only thing on it that needs a browser is this form. Keeping `"use client"` on
 * the page would have shipped the whole document - every check title, the
 * dimension table, the FAQ - as client JavaScript, because that is what the
 * directive does to a module. Here the boundary is two dozen lines wide and the
 * rest of the page never reaches the browser as code.
 *
 * It is written entirely against tokens and has no theme of its own, which is
 * what lets the same component sit on the black hero and on the black closing
 * band without a variant prop.
 */
export default function ScanForm({
  /** "hero" is the full-width box; "compact" is the same control, tighter. */
  variant = "hero",
  placeholder = "Enter domain or URL (e.g., adidas.com)",
}: {
  variant?: "hero" | "compact";
  placeholder?: string;
}) {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleScan = (event: React.FormEvent) => {
    event.preventDefault();
    const raw = url.trim();
    if (!raw) return;

    /*
     * Normalise before navigating, exactly as the inline handler used to: strip
     * the scheme and everything from the first slash onwards, so a pasted
     * "https://adidas.com/en/" and a typed "adidas.com" arrive at /report/ as
     * the same domain string.
     */
    const cleanDomain = raw.toLowerCase().replace(/^(https?:\/\/)/, "").replace(/\/.*$/, "");
    router.push(`/report/?domain=${encodeURIComponent(cleanDomain)}`);
  };

  const big = variant === "hero";

  return (
    <form onSubmit={handleScan} className={big ? "w-full max-w-2xl pt-2" : "w-full max-w-lg pt-2"}>
      <div
        className={`flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] shadow-2xl transition-all focus-within:border-[var(--accent)] sm:flex-row ${
          big ? "p-2" : "p-1.5"
        }`}
      >
        <label htmlFor={`scan-domain-${variant}`} className="sr-only">
          Domain to scan
        </label>
        <input
          id={`scan-domain-${variant}`}
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={placeholder}
          required
          className={`flex-1 bg-transparent px-4 text-sm text-[var(--ink-1)] placeholder-[var(--ink-3)] outline-none ${
            big ? "py-3" : "py-2.5"
          }`}
        />
        <button
          type="submit"
          className={`flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--accent)] font-medium text-[var(--on-accent)] transition-opacity hover:opacity-85 ${
            big ? "px-6 py-3 text-sm" : "px-5 py-2.5 text-[13px]"
          }`}
        >
          <span>Scan website</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
