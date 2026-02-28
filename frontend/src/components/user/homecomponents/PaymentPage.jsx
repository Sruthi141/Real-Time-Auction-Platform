import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const BACKEND = "http://localhost:4000";

export default function PaymentPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  // ✅ If your app does not store user in localStorage,
  // just keep userId dummy for now:
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id || user?.id || "demo-user";

  const [item, setItem] = useState(null);
  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  const fetchItem = async () => {
    try {
      const res = await axios.get(`${BACKEND}/payment/item/${itemId}`);
      setItem(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Unable to fetch item from backend. Check /payment/item/:id route");
    }
  };

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const confirmPayment = async () => {
    try {
      setLoading(true);

      // 1) Create payment
      const createRes = await axios.post(`${BACKEND}/payment/create`, {
        itemId,
        userId,
        method,
      });

      const paymentId = createRes.data?.payment?._id;
      if (!paymentId) {
        alert("❌ Payment not created. Check backend /payment/create response.");
        return;
      }

      // 2) Confirm payment
      await axios.post(`${BACKEND}/payment/confirm`, { paymentId });

      navigate("/payment-success");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "❌ Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return <div style={{ padding: 20 }}>Loading Payment Page...</div>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700 }}>Payment</h2>

      <div
        style={{
          marginTop: 12,
          padding: 14,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <p><b>Item:</b> {item.name}</p>
        <p><b>Amount:</b> ₹{item.current_price}</p>
        <p><b>Status:</b> {item.paid ? "Paid ✅" : "Not Paid ❌"}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ fontWeight: 600 }}>Payment Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 8,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <option value="upi">UPI</option>
          <option value="card">Card (Demo)</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      <button
        type="button"
        onClick={confirmPayment}
        disabled={loading || item.paid}
        style={{
          width: "100%",
          marginTop: 16,
          padding: 12,
          borderRadius: 10,
          border: "none",
          background: item.paid ? "#9ca3af" : "#16a34a",
          color: "white",
          fontWeight: 700,
          cursor: loading || item.paid ? "not-allowed" : "pointer",
        }}
      >
        {item.paid ? "Already Paid" : loading ? "Processing..." : "Confirm Payment"}
      </button>
    </div>
  );
}