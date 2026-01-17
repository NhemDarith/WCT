"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FiX } from "react-icons/fi";
import { RiGoogleFill, RiLoader4Line, RiShieldCheckFill } from "react-icons/ri";
import Swal from "sweetalert2";

const ATTEMPT_KEY = "google_login_attempt";

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const hasRun = useRef(false);

  const [mode, setMode] = useState("loading"); // "loading" | "error"
  const [message, setMessage] = useState("Checking your account...");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    let isCancelled = false;

    const safeSetMessage = (msg) => {
      if (!isCancelled) setMessage(msg);
    };

    const safeSetError = (msg) => {
      if (isCancelled) return;
      setErrorMessage(msg || "Something went wrong. Please try again.");
      setMode("error");
    };

    const cleanupAttemptFlag = () => {
      try {
        localStorage.removeItem(ATTEMPT_KEY);
      } catch {
        // ignore
      }
    };

    const handleCallback = async () => {
      let loginAttempted = null;
      try {
        loginAttempted = localStorage.getItem(ATTEMPT_KEY);
      } catch {
        loginAttempted = null;
      }

      if (!loginAttempted) {
        cleanupAttemptFlag();
        router.replace("/login_registration");
        return;
      }

      try {
        safeSetMessage("Finalizing Google sign-in...");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("No authenticated user found after Google redirect");

        const email = (session.user.email || "").trim().toLowerCase();
        if (!email) throw new Error("Google account is missing email information");

        safeSetMessage("Looking for your account...");

        const { data: dbUser, error: userError } = await supabase
          .from("users")
          .select("id, email, role")
          .eq("email", email)
          .maybeSingle();

        if (userError) throw userError;

        // ✅ Not registered -> show error screen (and sign out)
        if (!dbUser) {
          await supabase.auth.signOut();
          cleanupAttemptFlag();

          safeSetError(
            `This Google account (${email}) is not registered. Please register first or use another account.`
          );
          return;
        }

        // ✅ Registered -> show success alert, then redirect
        cleanupAttemptFlag();

        await Swal.fire({
          icon: "success",
          title: "Welcome back!",
          text: "Signed in successfully.",
          timer: 2000,
          showConfirmButton: false,
        });

        if (!isCancelled) router.replace("/home");
      } catch (err) {
        console.error("Google OAuth callback failed:", err);
        cleanupAttemptFlag();

        const msg =
          (err && typeof err === "object" && "message" in err && err.message) ||
          err?.error?.message ||
          "Authentication failed. Please try again.";

        safeSetError(msg);
      }
    };

    handleCallback();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  // Error screen
  if (mode === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-lg border border-red-100 p-8 md:p-10 text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-50 border-4 border-red-200 flex items-center justify-center">
            <FiX className="text-5xl text-red-500" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Something went wrong
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed break-words">{errorMessage}</p>

          <button
            onClick={() => router.replace("/login_registration")}
            className="inline-flex items-center px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Loading screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow border border-green-100/70 p-7 sm:p-9">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
            <RiGoogleFill className="text-3xl text-green-700" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">Signing you in</h2>
            <p className="text-sm text-gray-600 mt-0.5">{message}</p>
          </div>

          <RiLoader4Line className="ml-auto text-3xl text-green-600 animate-spin" />
        </div>

        <div className="bg-green-50/70 border border-green-100 rounded-xl p-4 flex items-start gap-3 text-sm">
          <RiShieldCheckFill className="text-green-700 text-xl mt-0.5 flex-shrink-0" />
          <p className="text-green-800/90">
            Please keep this tab open while we securely sign you in.
          </p>
        </div>
      </div>
    </div>
  );
}
