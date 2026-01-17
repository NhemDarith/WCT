"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Spinner from "@/components/spinner";

export default function OAuthCallback() {
  const router = useRouter();
  const [step, setStep] = useState("Checking session...");

  useEffect(() => {
    const run = async () => {
      // 1) Capture tokens from URL hash
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";

      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        setStep("Setting session...");

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error("setSession error:", error);
          router.replace("/login_registration");
          return;
        }

        // 2) IMPORTANT: remove tokens from the URL
        window.history.replaceState(null, "", window.location.pathname);
      }

      // 3) Now session should exist
      setStep("Fetching session...");
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        setStep("No session found. Redirecting...");
        setTimeout(() => router.replace("/login_registration"), 800);
        return;
      }

      const user = data.session.user;

      // 4) Your logic
      setStep("Checking account...");
      const { data: existingUser, error: userErr } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (userErr) {
        console.error("users select error:", userErr);
        router.replace("/login_registration");
        return;
      }

      if (!existingUser) {
        setStep("Creating account...");
        const { error: insertErr } = await supabase.from("users").insert({
          auth_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.given_name || "",
          last_name: user.user_metadata?.family_name || "",
          role: "user",
        });

        if (insertErr) {
          console.error("insert user error:", insertErr);
          router.replace("/login_registration");
          return;
        }

        router.replace("/login_registration?tab=signUp&method=google&step=3");
      } else {
        setStep("Welcome back!");
        router.replace("/home");
      }
    };

    run();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner />
      <p className="ml-4">{step}</p>
    </div>
  );
}
