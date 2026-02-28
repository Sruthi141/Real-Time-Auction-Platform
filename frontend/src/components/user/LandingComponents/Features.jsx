import React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Users, ShieldCheck, Settings, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: BadgeCheck,
    title: "Verified Users",
    description:
      "Email verification keeps the platform clean and reduces fake accounts and spam.",
    points: ["Email verified access", "Less spam", "Better trust"],
  },
  {
    icon: Users,
    title: "Verified Sellers",
    description:
      "Sellers are reviewed and verified to ensure authenticity and high-quality listings.",
    points: ["Trusted profiles", "Authentic listings", "Higher confidence"],
  },
  {
    icon: Settings,
    title: "Admin Control",
    description:
      "Powerful moderation tools to manage users, listings, and platform operations smoothly.",
    points: ["User management", "Listing moderation", "Operational control"],
  },
  {
    icon: ShieldCheck,
    title: "Secure Experience",
    description:
      "Built with safety-first practices for a reliable and trustworthy auction flow.",
    points: ["Secure flow", "Safe actions", "Reliable platform"],
  },
];

const ease = [0.16, 1, 0.3, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
};

export function Features() {
  return (
    <section className="relative overflow-hidden bg-[#060612] text-white py-20 sm:py-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/60" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -top-24 -left-24 h-[360px] w-[360px] rounded-full blur-3xl bg-gradient-to-r from-indigo-600/28 to-fuchsia-600/22" />
        <div className="absolute -bottom-28 -right-28 h-[460px] w-[460px] rounded-full blur-3xl bg-gradient-to-r from-cyan-500/12 to-indigo-500/22" />
        <div className="absolute inset-0 [box-shadow:inset_0_0_160px_rgba(0,0,0,0.9)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease }}
          className="text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/75">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Trust • Speed • Control
          </p>

          <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Why Choose{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-fuchsia-200">
              Hexart
            </span>
            ?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            A premium auction experience built for verified users, authentic sellers, and smooth admin control.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((f, idx) => (
            <motion.div key={idx} variants={item} className="group relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-indigo-600/40 to-fuchsia-600/35 opacity-20 blur-sm group-hover:opacity-70 transition" />

              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="relative h-full rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl
                shadow-[0_16px_60px_rgba(0,0,0,0.35)] p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-sm">
                    <f.icon className="h-6 w-6 text-white" />
                  </div>

                  <span className="text-[11px] font-semibold text-white/65 border border-white/12 bg-white/[0.04] rounded-full px-3 py-1">
                    Feature
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {f.description}
                </p>

                <div className="mt-5 space-y-2">
                  {f.points.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      {p}
                    </div>
                  ))}
                </div>

                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="mt-4 text-xs text-white/55">Optimized for clarity & trust.</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}