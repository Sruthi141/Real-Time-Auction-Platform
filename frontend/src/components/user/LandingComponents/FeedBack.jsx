import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquareText, Star } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1];

export default function FeedBack() {
  return (
    <section className="relative overflow-hidden bg-[#060612] text-white py-16 sm:py-20">
      {/* Unified background (same as Hero/Features) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />

        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* glows */}
        <div className="absolute -top-24 -left-24 h-[360px] w-[360px] rounded-full blur-3xl bg-gradient-to-r from-indigo-600/30 to-fuchsia-600/22" />
        <div className="absolute -bottom-28 -right-28 h-[460px] w-[460px] rounded-full blur-3xl bg-gradient-to-r from-cyan-500/12 to-indigo-500/22" />

        {/* vignette */}
        <div className="absolute inset-0 [box-shadow:inset_0_0_170px_rgba(0,0,0,0.9)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/75">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Feedback matters
            </div>

            <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.08]">
              Help us make{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-fuchsia-200">
                Hexart
              </span>{" "}
              even better.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              Your feedback helps us improve the bidding flow, listing clarity, and overall experience.
              It takes less than a minute.
            </p>

            {/* micro trust row */}
            <div className="mt-6 flex flex-wrap gap-3">
              <MiniChip icon={<MessageSquareText className="h-4 w-4" />} text="Quick form" />
              <MiniChip icon={<Star className="h-4 w-4" />} text="Improves UX" />
              <MiniChip icon={<Star className="h-4 w-4" />} text="Better auctions" />
            </div>
          </motion.div>

          {/* Right CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease, delay: 0.05 }}
            className="lg:col-span-5"
          >
            <div className="group relative">
              {/* glow border */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-indigo-600/40 to-fuchsia-600/35 opacity-25 blur-sm group-hover:opacity-70 transition" />

              <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 sm:p-8 shadow-[0_16px_60px_rgba(0,0,0,0.35)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Feedback Form</p>
                    <p className="mt-1 text-sm text-white/65">
                      Share what you liked and what we should improve.
                    </p>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-sm">
                    <MessageSquareText className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-white/70">
                  <Row text="UI clarity & layout" />
                  <Row text="Bidding speed & updates" />
                  <Row text="Seller / listing trust" />
                </div>

                <div className="mt-7">
                  <Link to="/feedback" className="group/btn relative inline-flex w-full">
                    <span className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r from-indigo-600/70 to-fuchsia-600/55 opacity-70 group-hover/btn:opacity-100 transition" />
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold
                      bg-gradient-to-r from-indigo-600 to-fuchsia-600"
                    >
                      Fill the Feedback Form
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition" />
                    </motion.button>
                  </Link>

                  <p className="mt-3 text-xs text-white/55 text-center">
                    Takes ~45 seconds • No personal info required
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MiniChip({ icon, text }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-xs text-white/75">
      <span className="text-white/80">{icon}</span>
      {text}
    </span>
  );
}

function Row({ text }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span>{text}</span>
      <span className="text-xs rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-white/60">
        Optional
      </span>
    </div>
  );
}