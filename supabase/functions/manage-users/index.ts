import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action } = await req.json();
    const results: string[] = [];

    if (action === "update-delivery") {
      const deliveryId = "43d18d95-a8ec-4317-b15e-a6856f681945";

      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(deliveryId, {
        email: "aguileralucianofranco@gmail.com",
        password: "Negro1",
        email_confirm: true,
      });
      if (updateAuthErr) throw new Error(`Update auth: ${updateAuthErr.message}`);
      results.push("✅ Delivery email/password updated");

      const { error: updateProfileErr } = await supabaseAdmin
        .from("profiles")
        .update({ name: "Luciano Franco Aguilera" })
        .eq("id", deliveryId);
      if (updateProfileErr) throw new Error(`Update profile: ${updateProfileErr.message}`);
      results.push("✅ Delivery profile name updated");
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
