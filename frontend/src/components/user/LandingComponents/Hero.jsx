import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#060612] text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-[1.03]"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-[#060612]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />

        {/* Soft glows */}
        <div className="absolute -top-24 -left-24 h-[360px] w-[360px] rounded-full blur-3xl bg-gradient-to-r from-indigo-600/45 to-fuchsia-600/30" />
        <div className="absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full blur-3xl bg-gradient-to-r from-cyan-500/16 to-indigo-500/30" />

        {/* Vignette */}
        <div className="absolute inset-0 [box-shadow:inset_0_0_170px_rgba(0,0,0,0.9)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="min-h-[calc(100vh-80px)] py-16 flex items-center">
          <div className="grid lg:grid-cols-12 gap-10 items-center w-full">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-4 py-2 text-sm text-white/85">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.7)]" />
                Live auctions • Verified sellers • Instant updates
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Bid smarter.{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200">
                  Win faster.
                </span>{" "}
                Discover premium auctions instantly.
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed">
                A clean, fast and trustworthy auction experience — designed for real-time bidding with
                verified users and secure flows.
              </p>

              {/* Single CTA */}
              <div className="mt-8">
                <Link to="/home" className="group relative inline-flex">
                  <span className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r from-indigo-600/70 to-fuchsia-600/55 opacity-70 group-hover:opacity-100 transition" />
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="relative inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold
                    bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow-[0_16px_45px_rgba(99,102,241,0.25)]"
                  >
                    Start Bidding
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
                  </motion.button>
                </Link>

                <div className="mt-3 text-xs text-white/60">
                  No extra steps • Secure flow • Smooth experience
                </div>
              </div>

              {/* Trust chips */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Chip icon={<ShieldCheck className="h-4 w-4" />} text="Secure payments" />
                <Chip icon={<Zap className="h-4 w-4" />} text="Real-time updates" />
                <Chip icon={<BadgeCheck className="h-4 w-4" />} text="Verified sellers" />
              </div>
            </motion.div>

            {/* Right card */}
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.95, delay: 0.12, ease }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl border border-white/12 bg-white/[0.07] backdrop-blur-2xl overflow-hidden shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Featured Auction</p>
                    <p className="text-xs text-white/70 mt-0.5">Ends in 12m 41s</p>
                  </div>
                  <span className="text-xs rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-white/80">
                    Trending
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs text-white/70">Current highest bid</p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight">₹ 24,500</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                      <span>27 bids</span>
                      <span>142 watching</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat title="Increment" value="₹ 500" />
                    <MiniStat title="Reserve" value="Met" />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/75">
                    Tip: Place bids early for better visibility.
                  </div>
                </div>

                <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-30" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chip({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-xs text-white/75">
      <span className="text-white/80">{icon}</span>
      {text}
    </span>
  );
}

function MiniStat({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs text-white/70">{title}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}