import BlogToc from "@/app/components/BlogToc";
import Comments from "@/app/components/Comments";
import { isPrefixedLocale } from "@/lib/i18n/config";

/**
 * The localized blog layout, for the same reason as the English one: the reading index is
 * pinned beside the article and the comments are mounted once for every article. The only
 * localized string is the index label; the comment box carries its own labels by pathname.
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
      <div className="wrap pb-16">
        <Comments />
      </div>
    </>
  );
}
