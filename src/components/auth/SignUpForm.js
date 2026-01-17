"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";


export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null); // "phone" or "google"

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  // Detect Google redirect
  useEffect(() => {
    const googleStep = searchParams.get("step");
    const googleMethod = searchParams.get("method");

    // If redirected from Google OAuth
    if (googleStep === "3" && googleMethod === "google") {
      setMethod("google");
      setStep(3);
    }
  }, [searchParams]);

  // ------------------------
  // Google Login
  // ------------------------
  const handleGoogleLogin = async () => {
    setMethod("google");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });

    if (error) alert("Google Login Failed");
    setLoading(false);
  };

  // ------------------------
  // Phone: Send OTP
  // ------------------------
  const sendOtp = async () => {
    setMethod("phone");

    if (!profile.firstName || !profile.lastName || !phone) {
      alert("Please fill all fields before requesting OTP");
      return;
    }

    const fullPhone = "+855" + phone;

    // 1. Check if phone already exists
    const { data: existingUser, error } = await supabase
      .from("users")
      .select("id")
      .eq("phone_number", fullPhone)
      .maybeSingle();

    if (existingUser) {
      alert("Phone number already registered. Please use another number.");
      return;
    }

    // 2. Phone not registered → send OTP
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone }),
    });

    const data = await res.json();
    if (data.success) setStep(2);
    else alert("Failed to send OTP");
  };


  // ------------------------
  // Phone: Verify OTP
  // ------------------------
  const verifyOtp = async () => {

    const fullPhone = "+855" + phone;

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone, code: otp }),
    });

    const data = await res.json();
    if (data.success) setStep(3);
    else alert("Invalid OTP");
  };

  // ------------------------
  // Submit Profile
  // ------------------------
  const submitProfile = async () => {
    setLoading(true);

    // Insert into Supabase.users
    const { error } = await supabase.from("users").insert({
      auth_id: null, 
      first_name: profile.firstName,
      last_name: profile.lastName,
      phone_number: "+855" + phone,
      role: "admin",
    });

    setLoading(false);

    if (!error) router.push("/home");
    else alert("Registration failed: " + error.message);
  };


  return (
    <div className="p-4 space-y-4">
      {/* STEP 1 – Choose Method */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Create Account</h2>

          <input
            className="border p-2 w-full"
            placeholder="First Name"
            value={profile.firstName}
            onChange={(e) =>
              setProfile({ ...profile, firstName: e.target.value })
            }
          />

          <input
            className="border p-2 w-full"
            placeholder="Last Name"
            value={profile.lastName}
            onChange={(e) =>
              setProfile({ ...profile, lastName: e.target.value })
            }
          />

          <label className="block">Phone Number</label>
          <div className="flex">
            <Select>
              <SelectTrigger className="min-h-10.5 rounded-r-none">
                <SelectValue placeholder="+855" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="855">+855</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="tel"
              className="border p-2 w-full rounded-l-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            className="bg-green-600 text-white p-2 rounded w-full"
            onClick={sendOtp}
          >
            Request verification code
          </button>

          <div className="text-center text-gray-500">or</div>

          <button
            className="bg-gray-200 p-2 w-full rounded"
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </button>
        </div>
      )}


      {/* STEP 2 – Phone OTP */}
      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Verify OTP</h2>

          <input
            type="text"
            className="border p-2 w-full"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />

          <button
            className="bg-green-600 text-white p-2 w-full rounded"
            onClick={verifyOtp}
          >
            Verify
          </button>
        </div>
      )}

      {/* STEP 3 – Profile */}
      {step === 3 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Your Profile</h2>

          <input
            className="border p-2 w-full"
            placeholder="First Name"
            value={profile.firstName}
            onChange={(e) =>
              setProfile({ ...profile, firstName: e.target.value })
            }
          />

          <input
            className="border p-2 w-full"
            placeholder="Last Name"
            value={profile.lastName}
            onChange={(e) =>
              setProfile({ ...profile, lastName: e.target.value })
            }
          />

          {method === "google" && (
            <input
              className="border p-2 w-full"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}

          <button
            className="bg-black text-white p-2 w-full rounded"
            onClick={submitProfile}
            disabled={loading}
          >
            {loading ? "Saving..." : "Complete Registration"}
          </button>
        </div>
      )}
    </div>
  );
}
