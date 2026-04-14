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

    // Verify caller is admin (mandatory)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");
    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // ── CREATE USER ──
    if (action === "create-user") {
      const { email, password, name, phone, role, customer_id } = payload;

      if (phone) {
        const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", phone).maybeSingle();
        if (existing) return json({ error: "Ya existe un usuario con ese teléfono" }, 400);
      }

      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { name, phone: phone || "" },
      });
      if (createErr) return json({ error: createErr.message }, 400);

      const userId = newUser.user.id;
      await supabaseAdmin.from("profiles").upsert(
        { id: userId, name, phone: phone || null, ...(customer_id ? { customer_id } : {}) },
        { onConflict: "id" }
      );
      if (role) {
        await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      }
      return json({ success: true, user_id: userId });
    }

    // ── UPDATE USER ──
    if (action === "update-user") {
      const { user_id, name, phone, role, is_active, email, password, staff_status } = payload;

      if (phone) {
        const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", phone).neq("id", user_id).maybeSingle();
        if (existing) return json({ error: "Ya existe un usuario con ese teléfono" }, 400);
      }

      const profileUpdate: Record<string, unknown> = {};
      if (name !== undefined) profileUpdate.name = name;
      if (phone !== undefined) profileUpdate.phone = phone || null;
      if (is_active !== undefined) profileUpdate.is_active = is_active;
      if (staff_status !== undefined) profileUpdate.staff_status = staff_status;

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await supabaseAdmin.from("profiles").update(profileUpdate).eq("id", user_id);
        if (error) throw new Error(error.message);
      }

      const authUpdate: Record<string, unknown> = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;
      if (Object.keys(authUpdate).length > 0) {
        authUpdate.email_confirm = true;
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdate);
        if (error) throw new Error(error.message);
      }

      if (role !== undefined) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        if (role) await supabaseAdmin.from("user_roles").insert({ user_id, role });
      }
      return json({ success: true });
    }

    // ── PAUSE USER ──
    if (action === "pause-user") {
      const { user_id } = payload;
      await supabaseAdmin.from("profiles").update({ staff_status: "pausado", is_active: false }).eq("id", user_id);
      return json({ success: true });
    }

    // ── REMOVE STAFF (dar de baja) ──
    if (action === "remove-staff") {
      const { user_id } = payload;
      // Check if last admin
      const { data: targetRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user_id).eq("role", "admin");
      if (targetRoles && targetRoles.length > 0) {
        const { data: allAdmins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
        if (allAdmins && allAdmins.length <= 1) {
          return json({ error: "No se puede dar de baja al único admin" }, 400);
        }
      }
      // Remove all roles
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      // Mark as baja
      await supabaseAdmin.from("profiles").update({ staff_status: "baja", is_active: false }).eq("id", user_id);
      return json({ success: true });
    }

    // ── DEACTIVATE USER ──
    if (action === "deactivate-user") {
      const { user_id } = payload;
      const { data: adminRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
      const { data: targetRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user_id).eq("role", "admin");

      if (targetRoles && targetRoles.length > 0) {
        const activeAdmins = adminRoles || [];
        const { data: activeAdminProfiles } = await supabaseAdmin.from("profiles").select("id").eq("is_active", true).in("id", activeAdmins.map(r => r.user_id));
        if (activeAdminProfiles && activeAdminProfiles.length <= 1) {
          return json({ error: "No se puede desactivar al único admin activo" }, 400);
        }
      }
      await supabaseAdmin.from("profiles").update({ is_active: false }).eq("id", user_id);
      return json({ success: true });
    }

    // ── GET USER EMAIL ──
    if (action === "get-user-email") {
      const { user_id } = payload;
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(user_id);
      if (error) throw new Error(error.message);
      return json({ email: data.user.email });
    }

    // Legacy
    if (action === "setup" || action === "update-delivery") {
      return json({ success: true, message: "Legacy action, no-op" });
    }

    return json({ error: "Acción no reconocida" }, 400);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
