// src/app/checkout/[id]/page.tsx
import { CheckoutClient } from "./CheckoutClient";

export default function CheckoutPage({ params }: { params: { id: string } }) {
  return <CheckoutClient id={params.id} />;
}
