import BlogToc from "@/app/components/BlogToc";

/**
 * The blog route's layout. It exists for one thing: the reading index, which needs to sit
 * outside the article's own markup so it can be pinned beside it. The articles keep their own
 * chrome and metadata; nothing else is wrapped here.
 */
export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <BlogToc label="On this page" />
      {children}
    </>
  );
}
