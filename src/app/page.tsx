// src/app/page.tsx
import { ProductGrid } from "./page-components/ProductGrid";


export default function HomePage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 48 }}>
        <p style={{
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
          fontWeight: 600,
          marginBottom: 12,
        }}>
          Multi-warehouse catalog
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px, 5vw, 56px)",
          lineHeight: 1.1,
          letterSpacing: "-1px",
          color: "var(--ink)",
          marginBottom: 16,
        }}>
          Available Products
        </h1>
        <p style={{
          fontSize: 16,
          color: "var(--ink-muted)",
          maxWidth: 540,
          lineHeight: 1.6,
        }}>
          Reserve a unit to hold stock for 10 minutes while you complete payment. 
          Reservations are released automatically if not confirmed.
        </p>
      </div>

      <ProductGrid />
    </div>
  );
}
