import React from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentButton({ item }) {
  const navigate = useNavigate();

  const handlePayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!item?._id) {
      alert("Item ID not found");
      return;
    }

    // Check if item is already paid
    if (item?.paid) {
      alert("This item has already been paid for");
      return;
    }

    // Items now stay in collection permanently, so _id works directly
    navigate(`/pay/${item._id}`);
  };

  return (
    <button
      type="button"
      onClick={handlePayClick}
      disabled={item?.paid}
      className="payment-button"
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        background: item?.paid ? "#9ca3af" : "#ef4444",
        color: "white",
        border: "none",
        cursor: item?.paid ? "not-allowed" : "pointer",
        fontWeight: 600,
        position: "relative",
        zIndex: 10,
        pointerEvents: "auto",
      }}
    >
      {item?.paid ? "Paid ✅" : "Pay Now"}
    </button>
  );
}
