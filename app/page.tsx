"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [domain, setDomain] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    
    // 清理域名输入（移除 http:// 或 https:// 以及末尾斜杠）
    const cleanDomain = domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    router.push(`/report/${encodeURIComponent(cleanDomain)}`);
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>GEO Visibility Engine</div>
        <h1 style={styles.title}>Brand GEO Visibility Scanner</h1>
        <p style={styles.subtitle}>
          Analyze your brand’s AI search share and recommendations across ChatGPT, Perplexity, Gemini, and Claude.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Enter brand domain (e.g., adidas.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Scan Visibility
          </button>
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "radial-gradient(circle at top, #1e293b 0%, #0b0f19 100%)",
  },
  card: {
    maxWidth: "600px",
    width: "100%",
    textAlign: "center",
    padding: "40px",
    borderRadius: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    color: "#60a5fa",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "16px",
    border: "1px solid rgba(96, 165, 250, 0.3)",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "32px",
    lineHeight: "1.6",
  },
  form: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "#ffffff",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    padding: "14px 24px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};