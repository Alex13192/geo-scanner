import BlogToc from "@/app/components/BlogToc";
import { isPrefixedLocale } from "@/lib/i18n/config";

/**
 * The localized blog layout, for the same reason as the English one: the reading index is
 * pinned beside the article rather than inside it. The label is the only localized string.
 */
const LABELS: Record<string, string> = {
  zh: "本页目录",
  ja: "目次",
};

export default async function LocaleBlogLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  const label = isPrefixedLocale(locale) ? (LABELS[locale] ?? "目次") : "On this page";
  return (
    <>
      <BlogToc label={label} />
      {children}
    </>
  );
}
