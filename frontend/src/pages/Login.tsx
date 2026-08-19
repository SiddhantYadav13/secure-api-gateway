// Login — polished split-screen sign-in with validation and error handling.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Lock, KeyRound, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import GradientText from "../components/GradientText";
import BorderGlow from "../components/BorderGlow";
import Topography from "../components/Topography";

interface FormData {
  username: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await login(data.username, data.password);
      navigate("/app/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Login failed. Check your credentials.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Animated topographic background (sits behind everything) */}
      <div className="fixed inset-0 -z-20 pointer-events-none opacity-70">
        <Topography
          lowColor="#3B82F6"
          midColor="#8B5CF6"
          highColor="#DDD6FE"
          speed={0.3}
          morphAmount={1.25}
          bands={2.6}
          thickness={0.01}
          glow={0.3}
          contrast={3.5}
          brightness={1.05}
          scale={1.0}
          grain
          grainIntensity={0.035}
          mouseInteraction={false}
        />
      </div>
      {/* Dark scrim so the bright contour field doesn't wash out the content */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(130% 100% at 50% 30%, rgba(11,17,32,0.35), rgba(11,17,32,0.82) 70%)",
        }}
      />

      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 relative overflow-hidden border-r border-white/5">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <ShieldCheck
            size={38}
            stroke="url(#sentinel-logo-gradient)"
            className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]"
          />
          <GradientText
            colors={["#3B82F6", "#8B5CF6", "#C084FC", "#3B82F6"]}
            animationSpeed={6}
            className="font-bold text-3xl"
          >
            SentinelX
          </GradientText>
        </Link>
        <h2 className="text-4xl font-bold text-white leading-tight max-w-md">
          Your security operations console
        </h2>
        <p className="text-slate-400 mt-4 max-w-md">
          Sign in to inspect requests, simulate attacks, and monitor your
          gateway in real time.
        </p>
        <div className="space-y-4 mt-10">
          {[
            { icon: KeyRound, text: "JWT authentication & role-based access" },
            { icon: Lock, text: "AES-256 + RSA-2048 encrypted payloads" },
            { icon: Activity, text: "Live risk scoring & audit logging" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-lg bg-white/5 text-accent">
                  <Icon size={18} />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-12">
        <BorderGlow
          className="w-full max-w-md"
          colors={["#22D3EE", "#3B82F6", "#8B5CF6"]}
          glowColor="190 85 62"
          backgroundColor="#0d1526"
          borderRadius={16}
          glowRadius={34}
          glowIntensity={0.9}
          coneSpread={25}
          fillOpacity={0.4}
          animated
        >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8"
        >
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">
            Sign in to your gateway account
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">
                Username
              </label>
              <input
                className="input-field"
                placeholder="admin"
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && (
                <p className="text-danger text-xs mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Spinner /> : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            No account?{" "}
            <Link to="/register" className="text-accent hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Demo accounts</p>
            <p>admin / admin123 &nbsp;·&nbsp; client / client123</p>
          </div>
        </motion.div>
        </BorderGlow>
      </div>
    </div>
  );
}
