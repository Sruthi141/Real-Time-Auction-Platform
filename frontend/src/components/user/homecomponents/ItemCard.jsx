import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Clock, User, Tag, ArrowRight } from "lucide-react";

/**
 * Premium Item Card (UI-only)
 * - Safe date parsing
 * - Supports StartTime/startTime and EndTime/endTime
 * - Clean CTA states + countdown
 * - No backend changes
 */

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-IN");
}

function formatDate(d) {
  if (!d) return "N/A";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

function formatTime(d) {
  if (!d) return "N/A";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function msToText(ms) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ItemCard({ item, isLiked, onLikeToggle }) {
  const {
    start,
    end,
    hasTiming,
    auctionStatus,
    countdownText,
  } = useMemo(() => {
    const date = safeDate(item?.date);

    // Support both possible field names
    const startRaw = item?.StartTime ?? item?.startTime ?? item?.start_time;
    const endRaw = item?.EndTime ?? item?.endTime ?? item?.end_time;

    const start = safeDate(startRaw);
    const end = safeDate(endRaw);

    const hasTiming = Boolean(date && start && end);

    const now = new Date();
    let auctionStatus = "NO_DETAILS"; // NOT_STARTED | LIVE | ENDED | NO_DETAILS
    let countdownText = "";

    if (!hasTiming) {
      auctionStatus = "NO_DETAILS";
    } else if (now < start) {
      auctionStatus = "NOT_STARTED";
      countdownText = `Starts in ${msToText(start.getTime() - now.getTime())}`;
    } else if (now >= start && now <= end) {
      auctionStatus = "LIVE";
      countdownText = `Ends in ${msToText(end.getTime() - now.getTime())}`;
    } else {
      auctionStatus = "ENDED";
      countdownText = "Auction ended";
    }

    return { start, end, hasTiming, auctionStatus, countdownText };
  }, [item]);

  const imageUrl = item?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80";
  const title = item?.name || "Untitled Item";
  const owner = item?.person || "Unknown";
  const basePrice = formatMoney(item?.base_price);
  const currentPrice = formatMoney(item?.current_price);

  const badge =
    auctionStatus === "LIVE"
      ? { text: "Live", className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25" }
      : auctionStatus === "NOT_STARTED"
      ? { text: "Upcoming", className: "bg-indigo-500/15 text-indigo-200 border-indigo-500/25" }
      : auctionStatus === "ENDED"
      ? { text: "Ended", className: "bg-zinc-500/15 text-zinc-200 border-zinc-500/25" }
      : { text: "No timing", className: "bg-amber-500/15 text-amber-200 border-amber-500/25" };

  return (
    <div className="group relative">
      {/* Glow border */}
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-indigo-600/35 to-fuchsia-600/30 opacity-20 blur-sm group-hover:opacity-60 transition" />

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_16px_60px_rgba(0,0,0,0.35)]">
        {/* Image */}
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />

          {/* Top gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {/* Status badge */}
          <div className="absolute left-4 top-4">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              <span className="h-2 w-2 rounded-full bg-current opacity-70" />
              {badge.text}
            </span>
          </div>

          {/* Like */}
          <button
            type="button"
            onClick={onLikeToggle}
            className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border
              backdrop-blur-xl transition
              ${
                isLiked
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-200"
                  : "bg-white/10 border-white/15 text-white/80 hover:bg-white/15"
              }`}
            aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Countdown */}
          {countdownText ? (
            <div className="absolute left-4 bottom-4">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.07] px-3 py-2 text-xs text-white/80">
                <Clock className="h-4 w-4" />
                {countdownText}
              </span>
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Owner */}
          <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
            <User className="h-4 w-4" />
            <span className="truncate">Owner: {owner}</span>
          </div>

          {/* Prices */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PriceBox label="Base price" value={`₹ ${basePrice}`} />
            <PriceBox label="Current price" value={`₹ ${currentPrice}`} highlight />
          </div>

          {/* Timing */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
              <Tag className="h-4 w-4" />
              Auction Timing
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <InfoRow label="Date" value={formatDate(safeDate(item?.date))} />
              <InfoRow label="Start" value={formatTime(start)} />
              <InfoRow label="End" value={formatTime(end)} />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-5">
            {hasTiming && auctionStatus === "LIVE" ? (
              <Link
                to={`/auction/${item?._id}`}
                className="group/btn relative inline-flex w-full"
              >
                <span className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r from-indigo-600/70 to-fuchsia-600/55 opacity-70 group-hover/btn:opacity-100 transition" />
                <span
                  className="relative inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3
                  font-semibold bg-gradient-to-r from-indigo-600 to-fuchsia-600"
                >
                  Place Bid
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition" />
                </span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-2xl px-4 py-3 font-semibold border border-white/12 bg-white/[0.05] text-white/60 cursor-not-allowed"
              >
                {auctionStatus === "NOT_STARTED"
                  ? "Auction not started yet"
                  : auctionStatus === "ENDED"
                  ? "Auction ended"
                  : "Auction details not available"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceBox({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <p className="text-xs text-white/60">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${highlight ? "text-emerald-200" : "text-white"}`}>
        {value}
      </p>
    </div>

  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-xs text-white/80">{value}</span>
    </div>
  );
}