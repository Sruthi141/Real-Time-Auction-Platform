// Item.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BACKEND = process.env.REACT_APP_BACKENDURL;

export default function Item() {
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ supports both route param names: /item/:item OR /item/:id
  const params = useParams();
  const itemId = params.item || params.id;

  const sellerid = Cookies.get("seller");
  const navigate = useNavigate();

  const normalizeItem = useCallback((raw) => {
    if (!raw) return null;

    // ✅ make UI safe even if backend uses different keys
    const auction_history = Array.isArray(raw.auction_history)
      ? raw.auction_history
      : Array.isArray(raw.auctionHistory)
      ? raw.auctionHistory
      : [];

    return {
      ...raw,
      _id: raw._id || raw.id,
      name: raw.name ?? "",
      seller: raw.seller ?? raw.sellerName ?? "",
      url: raw.url ?? raw.imageUrl ?? raw.image ?? "",
      base_price: raw.base_price ?? raw.basePrice ?? 0,
      current_price: raw.current_price ?? raw.currentPrice ?? 0,
      current_bidder: raw.current_bidder ?? raw.currentBidder ?? "",
      auction_history,
      auction_active:
        raw.auction_active ??
        raw.aution_active ?? // ✅ typo support
        raw.auctionActive ??
        true,
    };
  }, []);

  const fetchItemData = useCallback(async () => {
    if (!sellerid || !itemId) return;

    try {
      const res = await fetch(`${BACKEND}/sell/${sellerid}/${itemId}`);
      const json = await res.json();

      // your old code: data.data.item
      const rawItem =
        json?.data?.item ||
        json?.item ||
        json?.data ||
        json;

      setItemData(normalizeItem(rawItem));
    } catch (error) {
      console.error("Error fetching item data:", error);
    } finally {
      setLoading(false);
    }
  }, [sellerid, itemId, normalizeItem]);

  useEffect(() => {
    setLoading(true);
    fetchItemData();
    const intervalId = setInterval(fetchItemData, 3000);
    return () => clearInterval(intervalId);
  }, [fetchItemData]);

  const handleSellSubmit = async (e) => {
    e.preventDefault();

    const history = itemData?.auction_history || [];
    if (history.length === 0) {
      alert("No bids have been placed yet. You cannot sell this item.");
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND}/sell/${sellerid}/${itemId}`,
        {},
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("sell response:", response?.data);

      alert("Item sold successfully!");
      setTimeout(() => navigate(`/sellerhome`), 800);
    } catch (error) {
      console.error("Error submitting sell:", error);
      alert("Failed to sell item. Check console for details.");
    }
  };

  const chartData = useMemo(() => {
    const history = itemData?.auction_history || [];
    return history.map((h, idx) => ({
      name: `Bid ${idx + 1}`,
      amount: Number(h?.price ?? 0),
    }));
  }, [itemData]);

  const { minPrice, maxPrice } = useMemo(() => {
    const prices = (itemData?.auction_history || []).map((h) =>
      Number(h?.price ?? 0)
    );
    if (prices.length === 0) return { minPrice: 0, maxPrice: 0 };
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [itemData]);

  if (loading || !itemData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-white to-blue-500 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/sellerhome"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span>Back</span>
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <img
                src={itemData.url || "/placeholder.svg"}
                alt={itemData.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 md:w-1/2">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {itemData.name}
              </h1>

              <p className="text-gray-600 mb-4">
                <UserIcon className="w-5 h-5 inline mr-2" />
                {itemData.seller}
              </p>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Current Status
                </h2>
                <div className="flex justify-between items-center bg-blue-100 p-3 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{Number(itemData.current_price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Base Price</p>
                    <p className="text-xl font-semibold text-purple-600">
                      ₹{Number(itemData.base_price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Bid History
                </h2>
                <div className="max-h-40 overflow-y-auto">
                  {(itemData.auction_history || [])
                    .slice()
                    .reverse()
                    .map((history, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-200"
                      >
                        <span className="text-gray-700">
                          {history?.bidder || "Unknown"}
                        </span>
                        <span className="text-blue-600 font-semibold">
                          ₹{Number(history?.price || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  {(itemData.auction_history || []).length === 0 && (
                    <div className="text-sm text-gray-500 py-2">
                      No bids yet
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSellSubmit}>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
                >
                  Sell Item
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Bid Progress
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis domain={[minPrice, maxPrice]} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}