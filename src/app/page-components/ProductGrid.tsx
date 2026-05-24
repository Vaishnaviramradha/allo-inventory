"use client";
// src/app/page-components/ProductGrid.tsx
import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import { ReserveModal } from "./ReserveModal";

type StockEntry = {
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  total: number;
  reserved: number;
  available: number;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stock: StockEntry[];
};

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 24,
      }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            height: 380,
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 32,
        background: "#FFF5F5",
        border: "1px solid #FECACA",
        borderRadius: 12,
        color: "#991B1B",
      }}>
        <strong>Error loading products:</strong> {error}
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 24,
      }}>
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            onReserve={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      {selectedProduct && (
        <ReserveModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {
            setSelectedProduct(null);
            fetchProducts();
          }}
        />
      )}
    </>
  );
}
