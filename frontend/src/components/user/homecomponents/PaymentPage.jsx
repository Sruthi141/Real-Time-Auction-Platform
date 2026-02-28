import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { loadStripe } from "@stripe/stripe-js";

const BACKEND = process.env.REACT_APP_BACKENDURL || "http://localhost:4000";

// Initialize Stripe (use your publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

export default function PaymentPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  // Get user from cookies (consistent with rest of app)
  const userCookie = Cookies.get("user");
  const userId = userCookie || "demo-user";

  const [item, setItem] = useState(null);
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchItem = async () => {
    try {
      // Items now stay in collection permanently, so direct lookup works
      const res = await axios.get(`${BACKEND}/payment/item/${itemId}`);
      setItem(res.data);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch item details. Please try again.");
    }
  };

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // Handle Stripe Checkout
  const handleStripeCheckout = async () => {
    try {
      setLoading(true);
      setError("");

      const stripe = await stripePromise;
      
      if (!stripe) {
        // Stripe not configured - fall back to demo payment
        console.warn("Stripe not configured, using demo payment");
        await handleDemoPayment();
        return;
      }

      // Create checkout session on backend
      const response = await axios.post(`${BACKEND}/payment/create-checkout-session`, {
        items: [{
          name: item.name,
          price: Number(item.current_price),
          quantity: 1
        }],
        itemId: itemId,
        userId: userId
      });

      const sessionId = response.data.id;

      if (!sessionId) {
        throw new Error("Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
      // If Stripe fails, offer demo payment
      const useDemo = window.confirm(
        "Stripe checkout unavailable. Would you like to use demo payment instead?"
      );
      if (useDemo) {
        await handleDemoPayment();
      } else {
        setError(err?.response?.data?.error || err.message || "Payment failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo payment (UPI/Cash - simulated)
  const handleDemoPayment = async () => {
    try {
      setLoading(true);
      setError("");

      // 1) Create payment record
      const createRes = await axios.post(`${BACKEND}/payment/create`, {
        itemId,
        userId,
        method,
      });

      const paymentId = createRes.data?.payment?._id;
      if (!paymentId) {
        throw new Error("Payment record not created");
      }

      // 2) Confirm payment
      await axios.post(`${BACKEND}/payment/confirm`, { paymentId });

      navigate("/payment-success");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (method === "card") {
      handleStripeCheckout();
    } else {
      handleDemoPayment();
    }
  };

  if (!item && !error) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb"
      }}>
        <div>
          <div style={{
            width: 40,
            height: 40,
            border: "4px solid #e5e7eb",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <p style={{ color: "#6b7280" }}>Loading payment details...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb"
      }}>
        <div style={{
          background: "white",
          padding: 32,
          borderRadius: 12,
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
        }}>
          <p style={{ color: "#ef4444", marginBottom: 16 }}>❌ {error}</p>
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 20, 
      maxWidth: 520, 
      margin: "40px auto",
      minHeight: "calc(100vh - 80px)"
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "#6b7280",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          fontSize: 14
        }}
      >
        ← Back
      </button>

      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Complete Payment</h2>

      {/* Item Details Card */}
      <div
        style={{
          padding: 20,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "white",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          {item.url && (
            <img 
              src={item.url} 
              alt={item.name}
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                borderRadius: 8
              }}
            />
          )}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{item.name}</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Owner: {item.person}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "#059669" }}>₹{item.current_price}</p>
          </div>
        </div>
        
        <div style={{ 
          marginTop: 16, 
          padding: "12px 16px", 
          background: item.paid ? "#dcfce7" : "#fef3c7",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>{item.paid ? "✅" : "⏳"}</span>
          <span style={{ 
            color: item.paid ? "#166534" : "#92400e",
            fontWeight: 500 
          }}>
            {item.paid ? "Payment Complete" : "Payment Pending"}
          </span>
        </div>
      </div>

      {/* Payment Method Selection */}
      {!item.paid && (
        <>
          <div style={{ marginTop: 24 }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: 12 }}>
              Select Payment Method
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                padding: 16,
                border: method === "card" ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                borderRadius: 10,
                cursor: "pointer",
                background: method === "card" ? "#eff6ff" : "white"
              }}>
                <input
                  type="radio"
                  name="method"
                  value="card"
                  checked={method === "card"}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ marginRight: 12 }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>💳 Card (Stripe)</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Secure payment via Stripe</div>
                </div>
              </label>

              <label style={{
                display: "flex",
                alignItems: "center",
                padding: 16,
                border: method === "upi" ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                borderRadius: 10,
                cursor: "pointer",
                background: method === "upi" ? "#eff6ff" : "white"
              }}>
                <input
                  type="radio"
                  name="method"
                  value="upi"
                  checked={method === "upi"}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ marginRight: 12 }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>📱 UPI (Demo)</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Simulated UPI payment</div>
                </div>
              </label>

              <label style={{
                display: "flex",
                alignItems: "center",
                padding: 16,
                border: method === "cash" ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                borderRadius: 10,
                cursor: "pointer",
                background: method === "cash" ? "#eff6ff" : "white"
              }}>
                <input
                  type="radio"
                  name="method"
                  value="cash"
                  checked={method === "cash"}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ marginRight: 12 }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>💵 Cash on Delivery (Demo)</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Pay when you receive</div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#dc2626",
              fontSize: 14
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 24,
              padding: 16,
              borderRadius: 10,
              border: "none",
              background: loading ? "#9ca3af" : "#16a34a",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Processing..." : `Pay ₹${item.current_price}`}
          </button>

          <p style={{ 
            marginTop: 16, 
            textAlign: "center", 
            fontSize: 12, 
            color: "#9ca3af" 
          }}>
            🔒 Your payment is secure and encrypted
          </p>
        </>
      )}

      {item.paid && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "14px 32px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Go to Home
          </button>
        </div>
      )}
    </div>
  );
}
