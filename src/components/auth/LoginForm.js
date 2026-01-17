"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FcGoogle } from "react-icons/fc";
import { 
  RiPhoneFill,
  RiShieldCheckFill,
  RiSmartphoneLine,
  RiMessage3Fill,
  RiArrowLeftLine
} from "react-icons/ri";
import Swal from "sweetalert2";

// Login Form Component
export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [rawPhone, setRawPhone] = useState("");
  const [otp, setOtp] = useState("");

  const sendOtp = async () => {
    const fullPhone = `+855${rawPhone}`;
    setPhone(fullPhone);
    setLoading(true);
    setMethod("otp");

    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", fullPhone)
        .maybeSingle();

      if (!existingUser) {
        Swal.fire({
          icon: "error",
          title: "Not Registered",
          text: "This phone number is not registered.",
          confirmButtonColor: "#10B981"
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

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: "Check your phone for the 6-digit code.",
          timer: 2000,
          showConfirmButton: false
        });
        setStep(2);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to send OTP. Try again.",
          confirmButtonColor: "#10B981"
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Please check your connection.",
        confirmButtonColor: "#10B981"
      });
    }

    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Invalid OTP",
        text: "Please enter a valid 6-digit OTP.",
        confirmButtonColor: "#10B981"
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Welcome Back!",
          text: "Redirecting to dashboard...",
          timer: 1500,
          showConfirmButton: false
        });
        router.push("/home");
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: "Please check and try again.",
          confirmButtonColor: "#10B981"
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Please try again.",
        confirmButtonColor: "#10B981"
      });
    }

    setLoading(false);
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMethod("gmail");

    try {
      localStorage.setItem("google_login_attempt", "true");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
    } catch {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Please try again.",
        confirmButtonColor: "#10B981"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Background */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-2xl blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-l from-teal-400/20 to-emerald-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>

        <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
              <RiShieldCheckFill className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Pharmart
            </h1>
            <p className="text-gray-500 font-medium">Admin Portal</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500 ease-in-out rounded-full ${
                step === 2 ? 'w-full' : 'w-1/2'
              }`}
            />
          </div>

          {/* Step 1: Phone Input */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <RiPhoneFill className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">Enter Phone Number</h3>
                  </div>
                </div>

                <div className="relative group">
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
                        // Allow 8 or 9 digits
                        if (value.length <= 9) setRawPhone(value);
                      }}
                      className="w-full px-4 py-3 text-lg font-semibold focus:outline-none bg-transparent"
                      disabled={loading}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                {/* OTP Button */}
                <div className="text-right mt-1">
                </div>
              </div>

              <button
                onClick={sendOtp}
                disabled={loading || rawPhone.length < 8}
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
                  <span className="px-3 bg-white text-gray-400 font-semibold tracking-wider">or</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group w-full flex items-center justify-center gap-3 py-4 px-6 border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && method === "gmail" ? (
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

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 mb-6">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setRawPhone("");
                  }}
                  className="p-2 -ml-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                >
                  <RiArrowLeftLine className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <RiMessage3Fill className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-gray-900">Verify OTP</h3>
                  <p className="text-sm text-gray-500">
                    Enter 6-digit code sent to <strong>+855{rawPhone}</strong>
                  </p>
                </div>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-6 py-5 text-xl font-mono font-semibold text-center bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 text-gray-900 tracking-widest"
                  disabled={loading}
                />
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
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
                Didn&apos;t receive code?{' '}
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

        {/* Footer */}
        <p className="text-center mt-8 text-xs text-gray-500">
          © 2026 Pharmart. All rights reserved.
        </p>
      </div>
    </div>
  );
}
