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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [rawPhone, setRawPhone] = useState("");
  const [otp, setOtp] = useState("");

  // ✅ If already logged in, go to dashboard immediately
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data?.session) router.replace("/home");
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const sendOtp = async () => {
    const fullPhone = `+855${rawPhone}`;
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

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: "Check your phone for the 6-digit code.",
          timer: 2000,
          showConfirmButton: false,
        });
        setStep(2);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to send OTP. Try again.",
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
    }

    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
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
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Welcome Back!",
          text: "Redirecting to dashboard...",
          timer: 1500,
          showConfirmButton: false,
        });
        router.push("/home");
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: "Please check and try again.",
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
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMethod("google");

    try {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
      // no setLoading(false) because browser will redirect
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
    </div>
  );
}
