import React from "react";

export default function PaymentButton({ item }) {
  const handlePayCapture = (e) => {
    // capture phase fires before bubbling + before parent handlers
    alert("CLICK ✅ (capture)");
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
  };

  return (
    <button
      type="button"
      onPointerDownCapture={handlePayCapture}
      onClickCapture={handlePayCapture}
      className="payment-button"
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        background: "#ef4444",
        color: "white",
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        position: "relative",
        zIndex: 2147483647, // max z-index
        pointerEvents: "auto",
      }}
    >
      Pay Now
    </button>
  );
}