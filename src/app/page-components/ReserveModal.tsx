"use client";
// src/app/page-components/ReserveModal.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "./ProductGrid";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ReserveModal({
  product,
  onClose,
  onSuccess,
}: {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const availableStock = product.stock.filter((s) => s.available > 0);
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    availableStock[0]?.warehouseId ?? ""
  );
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStock = availableStock.find((s) => s.warehouseId === selectedWarehouse);
  const maxQty = selectedStock?.available ?? 0;

  async function handleReserve() {
    setLoading(true);
    setError(null);
    try {
      const idempotencyKey = `reserve-${product.id}-${selectedWarehouse}-${Date.now()}`;
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ productId: product.id, warehouseId: selectedWarehouse, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reservation failed");
        return;
      }
      onSuccess();
      router.push(`/checkout/${data.id}`);
    } catch (e: any) {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-in"
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              Reserve Item
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: "-0.3px" }}>
              {product.name}
            </h2>
            <p style={{ fontSize: 18, fontFamily: "var(--font-display)", color: "var(--ink-muted)", marginTop: 4 }}>
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
              color: "var(--ink-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Warehouse selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Fulfil from warehouse
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {availableStock.map((s) => (
              <label
                key={s.warehouseId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  border: `1px solid ${selectedWarehouse === s.warehouseId ? "var(--ink)" : "var(--border)"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  background: selectedWarehouse === s.warehouseId ? "var(--ink)" : "transparent",
                  color: selectedWarehouse === s.warehouseId ? "white" : "var(--ink)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="radio"
                    name="warehouse"
                    value={s.warehouseId}
                    checked={selectedWarehouse === s.warehouseId}
                    onChange={() => { setSelectedWarehouse(s.warehouseId); setQuantity(1); }}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{s.warehouseName}</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{s.warehouseLocation}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {s.available} avail.
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Quantity
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{
                width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)",
                background: "none", cursor: "pointer", fontSize: 18, color: "var(--ink)",
              }}
            >
              −
            </button>
            <span style={{ fontSize: 20, fontWeight: 600, minWidth: 24, textAlign: "center" }}>{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              style={{
                width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)",
                background: "none", cursor: "pointer", fontSize: 18, color: "var(--ink)",
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FFF5F5",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#991B1B",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Hint */}
        <p style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 16, lineHeight: 1.5 }}>
          Your reservation holds stock for <strong>10 minutes</strong>. Complete payment before it expires.
        </p>

        <button
          onClick={handleReserve}
          disabled={loading || !selectedWarehouse}
          style={{
            width: "100%",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "14px",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "var(--font-sans)",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          {loading ? "Reserving…" : `Reserve ${quantity} unit${quantity > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
