
import { supabase } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false });

  const { auth_id, first_name, last_name, email, phone } = req.body;

  const { data, error } = await supabase.from("users").insert({
    auth_id,
    first_name,
    last_name,
    email,
    phone,
    role: "user",
  });

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.status(200).json({ success: true });
}
