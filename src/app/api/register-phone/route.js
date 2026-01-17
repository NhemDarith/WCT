import { supabase } from "@/lib/supabase";


export async function POST(req) {
  const body = await req.json();

  const { first_name, last_name, phone, email, role } = body;

  const { data, error } = await supabase
    .from("users")
    .insert({
      first_name,
      last_name,
      phone,
      email,
      role,
    })
    .select()
    .single();

  if (error)
    return Response.json({ success: false, message: error.message });

  return Response.json({ success: true, user: data });
}
