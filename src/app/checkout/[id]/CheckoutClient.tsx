"use client";
// src/app/checkout/[id]/CheckoutClient.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  quantity: number;
  expiresAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  product: {
    name: string;
    price: number;
    imageUrl: string | null;
    description: string | null;
  };
  warehouse: {
    name: string;
    location: string;
  };
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CheckoutClient({ id }: { id: string }) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchReservation = useCallback(async () => {
    const res = await fetch(`/api/reservations/${id}`);
    if (!res.ok) {
      setError("Reservation not found");
      setLoading(false);
      return;
    }
    const data: Reservation = await res.json();
    setReservation(data);
    setLoading(false);

    if (data.status === "PENDING") {
      const expires = new Date(data.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(remaining);
    }
  }, [id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  // Countdown timer
  useEffect(() => {
    if (!reservation || reservation.status !== "PENDING") return;
    if (timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Refresh to get updated status
          fetchReservation();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reservation?.status, fetchReservation]);

  async function handleConfirm() {
    setActionLoading(true);
    setError(null);
    try {
      const idempotencyKey = `confirm-${id}-${Date.now()}`;
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Confirmation failed");
        if (res.status === 410) fetchReservation();
        return;
      }
      setReservation(data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Release failed");
        return;
      }
      setReservation(data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px" }}>
        <div style={{
          background: "var(--surface)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          height: 420,
          animation: "pulse 1.5s ease infinite",
        }} />
      </div>
    );
  }

  if (!reservation && error) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 8 }}>Not Found</h2>
        <p style={{ color: "var(--ink-muted)", marginBottom: 24 }}>{error}</p>
        <a href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>← Back to products</a>
      </div>
    );
  }

  if (!reservation) return null;

  const isConfirmed = reservation.status === "CONFIRMED";
  const isReleased = reservation.status === "RELEASED";
  const isPending = reservation.status === "PENDING";
  const isExpiredPending = isPending && timeLeft === 0;

  const progressPct = totalSeconds > 0 ? (timeLeft / 600) * 100 : 0;
  const isUrgent = timeLeft <= 60 && isPending;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
      {/* Back link */}
      <a href="/" style={{
        fontSize: 13,
        color: "var(--ink-muted)",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        marginBottom: 32,
      }}>
        ← Back to products
      </a>

      <div
        className="animate-in"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Status banner */}
        {isConfirmed && (
          <div style={{
            background: "var(--green-light)",
            borderBottom: "1px solid #A7F3D0",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <p style={{ fontWeight: 700, color: "var(--green)", fontSize: 14 }}>Order Confirmed!</p>
              <p style={{ fontSize: 12, color: "var(--green)", opacity: 0.8 }}>
                Confirmed at {new Date(reservation.confirmedAt!).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
        {isReleased && (
          <div style={{
            background: "#F9FAFB",
            borderBottom: "1px solid var(--border)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>🔓</span>
            <div>
              <p style={{ fontWeight: 700, color: "var(--ink-muted)", fontSize: 14 }}>Reservation Released</p>
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                Stock has been returned to inventory
              </p>
            </div>
          </div>
        )}

        {/* Countdown bar */}
        {isPending && !isExpiredPending && (
          <div style={{ height: 4, background: "var(--border)", position: "relative" }}>
            <div
              style={{
                height: "100%",
                background: isUrgent ? "var(--accent)" : "var(--green)",
                width: `${progressPct}%`,
                transition: "width 1s linear, background 0.3s ease",
              }}
            />
          </div>
        )}

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Product info */}
          <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
            {reservation.product.imageUrl && (
              <img
                src={reservation.product.imageUrl}
                alt={reservation.product.name}
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)", flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                Reservation #{reservation.id.slice(-8).toUpperCase()}
              </p>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                letterSpacing: "-0.3px",
                marginBottom: 4,
              }}>
                {reservation.product.name}
              </h1>
              <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                {reservation.warehouse.name} · {reservation.warehouse.location}
              </p>
            </div>
          </div>

          {/* Details */}
          <div style={{
            background: "var(--bg)",
            borderRadius: 10,
            padding: "16px 18px",
            marginBottom: 24,
          }}>
            {[
              { label: "Quantity", value: `${reservation.quantity} unit${reservation.quantity > 1 ? "s" : ""}` },
              { label: "Unit price", value: formatPrice(reservation.product.price) },
              { label: "Total", value: formatPrice(reservation.product.price * reservation.quantity), bold: true },
              { label: "Status", value: reservation.status.charAt(0) + reservation.status.slice(1).toLowerCase() },
            ].map(({ label, value, bold }) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: "var(--ink)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Countdown */}
          {isPending && !isExpiredPending && (
            <div style={{
              background: isUrgent ? "#FFF7ED" : "var(--bg)",
              border: `1px solid ${isUrgent ? "#FED7AA" : "var(--border)"}`,
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <span style={{ fontSize: 24 }}>{isUrgent ? "⏰" : "⏳"}</span>
              <div>
                <p style={{ fontSize: 12, color: "var(--ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Reservation expires in
                </p>
                <p style={{
                  fontSize: 28,
                  fontFamily: "var(--font-display)",
                  color: isUrgent ? "var(--accent)" : "var(--ink)",
                  letterSpacing: "0.02em",
                }}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
          )}

          {isExpiredPending && (
            <div style={{
              background: "#FFF5F5",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 24,
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#991B1B", marginBottom: 4 }}>
                ⚠ Reservation Expired
              </p>
              <p style={{ fontSize: 13, color: "#B91C1C" }}>
                Your reservation has expired and the stock has been released.
              </p>
            </div>
          )}

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

          {/* Actions */}
          {isPending && !isExpiredPending && (
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  background: "var(--green)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: actionLoading ? "wait" : "pointer",
                  fontFamily: "var(--font-sans)",
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? "Processing…" : "✓ Confirm Purchase"}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                style={{
                  flex: 0,
                  background: "none",
                  color: "var(--ink-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "14px 20px",
                  fontSize: 14,
                  cursor: actionLoading ? "wait" : "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {(isConfirmed || isReleased || isExpiredPending) && (
            <a
              href="/"
              style={{
                display: "block",
                textAlign: "center",
                background: "var(--ink)",
                color: "white",
                textDecoration: "none",
                borderRadius: 10,
                padding: "14px",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              ← Back to Products
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
