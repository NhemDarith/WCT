"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FcGoogle } from "react-icons/fc";
import {
  RiPhoneFill,
  RiShieldCheckFill,
  RiSmartphoneLine,
  RiMessage3Fill,
  RiArrowLeftLine,
} from "react-icons/ri";
import Swal from "sweetalert2";

export default function LoginForm() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 phone, 2 otp
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("");

  const [phone, setPhone] = useState("");
  const [rawPhone, setRawPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  // ✅ If user returns from Google callback and session exists, mark logged in
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data?.session) {
        setLoggedIn(true);
        // Stay on this page (login/registration) — no redirect
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const sendOtp = async () => {
    const digits = String(rawPhone || "").replace(/\D/g, "");
    if (digits.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Invalid phone",
        text: "Please enter 8–9 digits.",
        confirmButtonColor: "#10B981",
      });
      return;
    }

    const fullPhone = `+855${digits}`;
    setPhone(fullPhone);
    setLoading(true);
    setMethod("otp");

    try {
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", fullPhone)
        .maybeSingle();

      if (error) throw error;

      if (!existingUser) {
        Swal.fire({
          icon: "error",
          title: "Not Registered",
          text: "This phone number is not registered.",
          confirmButtonColor: "#10B981",
        });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();

      if (data?.success) {
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: "Check your phone for the 6-digit code.",
          timer: 1600,
          showConfirmButton: false,
        });
        setStep(2);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data?.message || "Failed to send OTP. Try again.",
          confirmButtonColor: "#10B981",
        });
      }
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please check your connection and try again.",
        confirmButtonColor: "#10B981",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = String(otp || "").replace(/\D/g, "").slice(0, 6);

    if (code.length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "Invalid OTP",
        text: "Please enter a valid 6-digit OTP.",
        confirmButtonColor: "#10B981",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();

      if (data?.success) {
        Swal.fire({
          icon: "success",
          title: "Logged in!",
          text: "You can continue with registration.",
          timer: 1500,
          showConfirmButton: false,
        });

        // ✅ Stay on login/registration page, just mark logged in
        setLoggedIn(true);

        // (Optional) reset OTP UI
        setOtp("");
        setStep(1);

        // If you have server components reading cookies, refresh
        router.refresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: data?.message || "Please check and try again.",
          confirmButtonColor: "#10B981",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Please try again.",
        confirmButtonColor: "#10B981",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMethod("google");

    try {
      // IMPORTANT: set this in Vercel env too
      // NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
      const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
      // browser will redirect, so no setLoading(false) here
    } catch {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Please try again.",
        confirmButtonColor: "#10B981",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
              <RiShieldCheckFill className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Pharmart
            </h1>
            <p className="text-gray-500 font-medium">Login / Registration</p>

            {/* ✅ Logged In Banner */}
            {loggedIn && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm font-semibold">
                ✅ You are logged in. Continue with registration steps here.
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 ease-in-out rounded-full ${step === 2 ? "w-full" : "w-1/2"
                }`}
            />
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <RiPhoneFill className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900">
                    Enter Phone Number
                  </h3>
                </div>

                <div className="flex bg-white border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all duration-300">
                  <span className="px-4 py-3 bg-gray-50 text-gray-600 font-semibold border-r border-gray-200 flex items-center gap-1">
                    <RiSmartphoneLine className="w-4 h-4" />
                    +855
                  </span>
                  <input
                    type="tel"
                    placeholder="XXXXXXXX"
                    value={rawPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 9) setRawPhone(value);
                    }}
                    className="w-full px-4 py-3 text-lg font-semibold focus:outline-none bg-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                onClick={sendOtp}
                disabled={loading || rawPhone.replace(/\D/g, "").length < 8}
                className="group w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:from-emerald-600 hover:to-teal-700 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
              >
                {loading && method === "otp" ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RiMessage3Fill className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Send OTP Code
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-3 bg-white text-gray-400 font-semibold tracking-wider">
                    or
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group w-full flex items-center justify-center gap-3 py-4 px-6 border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && method === "google" ? (
                  <>
                    <div className="w-6 h-6 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <FcGoogle className="text-xl group-hover:scale-110 transition-transform" />
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 mb-6">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                  className="p-2 -ml-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                >
                  <RiArrowLeftLine className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-semibold text-xl text-gray-900">
                    Verify OTP
                  </h3>
                  <p className="text-sm text-gray-500">
                    Enter 6-digit code sent to <strong>+855{rawPhone}</strong>
                  </p>
                </div>
              </div>

              <input
                type="tel"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full px-6 py-5 text-xl font-mono font-semibold text-center bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 text-gray-900 tracking-widest"
                disabled={loading}
              />

              <button
                onClick={verifyOtp}
                disabled={loading || otp.replace(/\D/g, "").length !== 6}
                className="group w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-5 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:from-emerald-600 hover:to-teal-700 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RiShieldCheckFill className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Confirm & Login
                  </>
                )}
              </button>

              <p className="text-center text-sm">
                Didn&apos;t receive code?{" "}
                <button
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-xs text-gray-500">
          © 2026 Pharmart. All rights reserved.
        </p>
      </div>
    </div>
  );
}
