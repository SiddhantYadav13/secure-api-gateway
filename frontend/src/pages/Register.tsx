// Register — account creation with validation, role select, show-password.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import GradientText from "../components/GradientText";
import BorderGlow from "../components/BorderGlow";
import Aurora from "../components/Aurora";

interface FormData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues: { role: "client" } });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await registerUser(data.username, data.email, data.password, data.role);
      navigate("/app/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Registration failed.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      {/* Animated aurora background (sits behind everything) */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-50">
        <Aurora
          colorStops={["#2563EB", "#6D28D9", "#7C3AED"]}
          amplitude={1.0}
          blend={0.6}
          speed={0.5}
        />
      </div>

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
        <Link to="/" className="flex items-center gap-2 mb-6 justify-center">
          <ShieldCheck
            size={32}
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
        </Link>

        <h1 className="text-2xl font-bold text-white text-center">
          Create your account
        </h1>
        <p className="text-slate-400 text-sm mt-1 text-center">
          Join the security gateway platform
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
              placeholder="jane_doe"
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "At least 3 characters" },
              })}
            />
            {errors.username && (
              <p className="text-danger text-xs mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">Email</label>
            <input
              className="input-field"
              placeholder="jane@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
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
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                })}
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

          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">Role</label>
            <select className="input-field" {...register("role")}>
              <option value="client">Client (standard user)</option>
              <option value="admin">Admin (full access)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Spinner />
            ) : (
              <>
                <UserPlus size={18} /> Create account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
      </BorderGlow>
    </div>
  );
}
