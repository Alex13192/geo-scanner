import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Brand Visibility Scanner",
  description: "Check your brand visibility across generative search engines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0b0f19", color: "#ffffff", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}