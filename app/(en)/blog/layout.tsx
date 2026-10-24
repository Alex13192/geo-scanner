import BlogToc from "@/app/components/BlogToc";
import Comments from "@/app/components/Comments";

/**
 * The blog route's layout. It exists for two things: the reading index, which needs to sit
 * outside the article's own markup so it can be pinned beside it, and the comments, which then
 * exist on every article without each article having to remember them. The articles keep their
 * own chrome and metadata; nothing else is wrapped here.
 */
export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <BlogToc label="On this page" />
      {children}
      <div className="wrap pb-16">
        <Comments />
      </div>
    </>
  );
}
