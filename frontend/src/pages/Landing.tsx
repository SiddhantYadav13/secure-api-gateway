// Landing — the premium first-impression marketing screen.

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  FileCheck2,
  Activity,
  ArrowRight,
} from "lucide-react";
import Aurora from "../components/Aurora";
import GradientText from "../components/GradientText";
import DecryptedText from "../components/DecryptedText";

const features = [
  {
    icon: KeyRound,
    title: "Authentication",
    desc: "JWT-based identity with bcrypt password hashing and brute-force lockout.",
    color: "text-primary",
  },
  {
    icon: Lock,
    title: "Encryption",
    desc: "AES-256 payload encryption with RSA-2048 key exchange & digital signatures.",
    color: "text-accent",
  },
  {
    icon: FileCheck2,
    title: "Integrity",
    desc: "SHA-256 verification and replay protection stop tampered & duplicated requests.",
    color: "text-violet",
  },
  {
    icon: Activity,
    title: "Monitoring",
    desc: "Live risk scoring, audit logs, and a real-time security operations dashboard.",
    color: "text-success",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated aurora background (sits behind everything) */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-60">
        <Aurora
          colorStops={["#2563EB", "#6D28D9", "#7C3AED"]}
          amplitude={1.0}
          blend={0.6}
          speed={0.5}
        />
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-20">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={34}
            stroke="url(#sentinel-logo-gradient)"
            className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]"
          />
          <GradientText
            colors={["#3B82F6", "#8B5CF6", "#C084FC", "#3B82F6"]}
            animationSpeed={6}
            className="font-bold text-2xl"
          >
            SentinelX
          </GradientText>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass px-4 py-1.5 mb-8 !rounded-full text-xs text-slate-300"
        >
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          <DecryptedText
            text="Enterprise-grade API protection platform"
            animateOn="view"
            sequential
            revealDirection="start"
            speed={75}
            maxIterations={12}
            className="text-slate-300"
            encryptedClassName="text-violet-400/80"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-white max-w-3xl leading-tight"
        >
          Secure API Gateway for{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            modern applications
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 text-lg mt-6 max-w-xl"
        >
          Authenticate. Encrypt. Verify. Monitor. A security layer that sits
          between clients and your backend — inspecting every request in real
          time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-4 mt-10"
        >
          <Link
            to="/login"
            className="btn-primary flex items-center gap-2 text-base !px-6 !py-3"
          >
            Open Dashboard <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn-ghost text-base !px-6 !py-3">
            Create account
          </Link>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-20 max-w-6xl w-full">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass glass-hover p-6 text-left cursor-pointer"
              >
                <div className={`p-3 rounded-xl bg-white/5 w-fit ${f.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-white font-semibold mt-4">{f.title}</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <footer className="text-center text-slate-500 text-xs py-8">
        SentinelX · Secure API Gateway · Built for security demonstrations
      </footer>
    </div>
  );
}
