import React from "react";
import { Link } from "react-router-dom";

export default function PaymentSuccess() {
  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700 }}>Payment Successful ✅</h2>
      <p style={{ marginTop: 10 }}>
        Payment saved in DB and item marked as paid.
      </p>

      <Link
        to="/home"
        style={{
          display: "inline-block",
          marginTop: 16,
          padding: "10px 14px",
          borderRadius: 8,
          background: "#111827",
          color: "white",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Go Back Home
      </Link>
    </div>
  );
}