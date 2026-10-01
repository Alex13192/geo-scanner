"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

// 必填：告知静态导出框架此动态路由的默认预生成路径（可返回空数组或占位路径）
export async function generateStaticParams() {
  return [{ domain: "example.com" }];
}

interface ReportData {
  domain: string;
  score: number;
  engines: {
    name: string;
    visibility: number;
    status: string;
  }[];
  recommendations: string[];
}

export default function ReportPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = use(params);
  const domain = decodeURIComponent(resolvedParams.domain || "example.com");
  
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    // 模拟数据生成/异步加载
    const timer = setTimeout(() => {
      setReport({
        domain,
        score: Math.floor(Math.random() * 30) + 65,
        engines: [
          { name: "ChatGPT (SearchGPT)", visibility: 82, status: "High Visibility" },
          { name: "Perplexity AI", visibility: 74, status: "Moderate" },
          { name: "Google Gemini", visibility: 68, status: "Moderate" },
          { name: "Claude 3.5", visibility: 55, status: "Needs Improvement" },
        ],
        recommendations: [
          "Optimize brand entity citations across Wikipedia and Crunchbase.",
          "Increase structured data coverage for core product features.",
          "Improve domain sentiment signals in recent tech publications.",
        ],
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [domain]);

  if (loading) {
    return (
      <main style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: "20px", color: "#94a3b8" }}>
            Scanning GEO AI Share for <strong style={{ color: "#fff" }}>{domain}</strong>...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <Link href="/" style={styles.backLink}>&larr; Back to Search</Link>
          <h1 style={styles.title}>GEO Visibility Report</h1>
          <p style={styles.domainText}>Target Domain: <span style={{ color: "#60a5fa" }}>{report?.domain}</span></p>
        </div>

        <div style={styles.scoreCard}>
          <div style={styles.scoreValue}>{report?.score}<span style={{ fontSize: "24px" }}>/100</span></div>
          <div style={styles.scoreLabel}>Overall AI Recommendation Index</div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Engine Breakdown</h2>
          <div style={styles.grid}>
            {report?.engines.map((item, idx) => (
              <div key={idx} style={styles.engineCard}>
                <div style={styles.engineHeader}>
                  <span style={styles.engineName}>{item.name}</span>
                  <span style={styles.engineVisibility}>{item.visibility}%</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${item.visibility}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Key Optimization Insights</h2>
          <ul style={styles.recsList}>
            {report?.recommendations.map((rec, idx) => (
              <li key={idx} style={styles.recItem}>
                <span style={{ color: "#3b82f6", marginRight: "10px" }}>✓</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    padding: "40px 20px",
    background: "#0b0f19",
    color: "#ffffff",
  },
  wrapper: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  loadingBox: {
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    marginBottom: "30px",
  },
  backLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "14px",
    display: "inline-block",
    marginBottom: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
  },
  domainText: {
    color: "#94a3b8",
    margin: 0,
  },
  scoreCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "30px",
    textAlign: "center",
    marginBottom: "30px",
  },
  scoreValue: {
    fontSize: "56px",
    fontWeight: "bold",
    color: "#60a5fa",
  },
  scoreLabel: {
    color: "#94a3b8",
    fontSize: "14px",
    marginTop: "8px",
  },
  section: {
    marginBottom: "30px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "16px",
    borderLeft: "4px solid #3b82f6",
    paddingLeft: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  engineCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "16px",
    borderRadius: "8px",
  },
  engineHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "14px",
  },
  engineName: {
    color: "#e2e8f0",
  },
  engineVisibility: {
    fontWeight: "bold",
    color: "#60a5fa",
  },
  progressBarBg: {
    height: "6px",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: "3px",
  },
  recsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  recItem: {
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 18px",
    borderRadius: "8px",
    marginBottom: "10px",
    fontSize: "14px",
    color: "#cbd5e1",
  },
};