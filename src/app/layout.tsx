// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allo Inventory — Reserve & Shop",
  description: "Multi-warehouse inventory with real-time reservation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                color: "var(--ink)",
                letterSpacing: "-0.5px",
              }}>
                allo<span style={{ color: "var(--accent)" }}>.</span>
              </span>
            </a>
            <span style={{
              fontSize: 12,
              color: "var(--ink-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}>
              Inventory Platform
            </span>
          </div>
        </header>
        <main style={{ minHeight: "calc(100vh - 64px)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
