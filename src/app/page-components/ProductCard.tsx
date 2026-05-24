"use client";
// src/app/page-components/ProductCard.tsx
import type { Product } from "./ProductGrid";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductCard({
  product,
  index,
  onReserve,
}: {
  product: Product;
  index: number;
  onReserve: () => void;
}) {
  const totalAvailable = product.stock.reduce((sum, s) => sum + s.available, 0);
  const isOutOfStock = totalAvailable === 0;
  const isLowStock = totalAvailable > 0 && totalAvailable <= 3;

  return (
    <div
      className={`animate-in stagger-${Math.min(index + 1, 5)}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        cursor: isOutOfStock ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isOutOfStock) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
        (e.currentTarget as HTMLDivElement).style.transform = "";
      }}
    >
      {/* Image */}
      <div style={{
        height: 200,
        background: "var(--border)",
        overflow: "hidden",
        position: "relative",
      }}>
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {isOutOfStock && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              background: "white",
              color: "var(--ink)",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              Out of Stock
            </span>
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "var(--amber-light)",
            color: "var(--amber)",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
          }}>
            Only {totalAvailable} left
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{
            fontSize: 20,
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
            letterSpacing: "-0.3px",
          }}>
            {product.name}
          </span>
        </div>

        <p style={{
          fontSize: 13,
          color: "var(--ink-muted)",
          lineHeight: 1.5,
          marginBottom: 16,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {product.description}
        </p>

        {/* Warehouse stock */}
        <div style={{ marginBottom: 16 }}>
          {product.stock.map((s) => (
            <div key={s.warehouseId} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px 0",
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                {s.warehouseName}
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: s.available === 0 ? "var(--ink-faint)" : s.available <= 2 ? "var(--amber)" : "var(--green)",
              }}>
                {s.available === 0 ? "—" : `${s.available} avail.`}
              </span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            color: "var(--ink)",
          }}>
            {formatPrice(product.price)}
          </span>
          <button
            disabled={isOutOfStock}
            onClick={onReserve}
            style={{
              background: isOutOfStock ? "var(--border)" : "var(--ink)",
              color: isOutOfStock ? "var(--ink-faint)" : "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => {
              if (!isOutOfStock) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              if (!isOutOfStock) (e.currentTarget as HTMLButtonElement).style.background = "var(--ink)";
            }}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
