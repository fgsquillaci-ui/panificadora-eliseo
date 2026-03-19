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

    if (action === "setup") {
      // 1. Update revendedor1 email + password
      const revendedorId = "b0b8da90-1dd9-4889-b368-e20ec7e69129";
      
      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(revendedorId, {
        email: "choyleonivas@gmail.com",
        password: "Choy.1",
        email_confirm: true,
      });
      if (updateAuthErr) throw new Error(`Update auth: ${updateAuthErr.message}`);
      results.push("✅ Revendedor email/password updated");

      const { error: updateProfileErr } = await supabaseAdmin
        .from("profiles")
        .update({ name: "Choy" })
        .eq("id", revendedorId);
      if (updateProfileErr) throw new Error(`Update profile: ${updateProfileErr.message}`);
      results.push("✅ Revendedor profile name updated");

      // 2. Create or find admin user
      let adminUserId: string;
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: "santana2022eliseo@gmail.com",
        password: "Turulo",
        email_confirm: true,
        user_metadata: { name: "Eliseo Santana", phone: "" },
      });
      if (createErr) {
        // User already exists, find them
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((u: any) => u.email === "santana2022eliseo@gmail.com");
        if (!existing) throw new Error("Could not find or create admin user");
        adminUserId = existing.id;
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(adminUserId, { password: "Turulo", email_confirm: true });
        results.push(`✅ Admin user found & updated: ${adminUserId}`);
      } else {
        adminUserId = newUser.user.id;
        results.push(`✅ Admin user created: ${adminUserId}`);
      }

      // 3. Assign admin role (upsert)
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: adminUserId, role: "admin" }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(`Assign role: ${roleErr.message}`);
      results.push("✅ Admin role assigned");
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
