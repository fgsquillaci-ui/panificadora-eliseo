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

    // Verify caller is admin
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
      if (caller) {
        const { data: callerRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", caller.id)
          .eq("role", "admin");
        if (!callerRoles || callerRoles.length === 0) {
          return new Response(JSON.stringify({ error: "No autorizado" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { action, ...payload } = await req.json();

    if (action === "create-user") {
      const { email, password, name, phone, role, customer_id } = payload;

      // Check phone uniqueness
      if (phone) {
        const { data: existing } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("phone", phone)
          .maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ error: "Ya existe un usuario con ese teléfono" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Create auth user
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone: phone || "" },
      });
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = newUser.user.id;

      // Ensure profile exists (trigger should create it, but update name/phone)
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, name, phone: phone || null }, { onConflict: "id" });

      // Assign role
      if (role) {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update-user") {
      const { user_id, name, phone, role, is_active, email, password } = payload;

      // Check phone uniqueness (exclude self)
      if (phone) {
        const { data: existing } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("phone", phone)
          .neq("id", user_id)
          .maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ error: "Ya existe un usuario con ese teléfono" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update profile
      const profileUpdate: Record<string, unknown> = {};
      if (name !== undefined) profileUpdate.name = name;
      if (phone !== undefined) profileUpdate.phone = phone || null;
      if (is_active !== undefined) profileUpdate.is_active = is_active;

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", user_id);
        if (error) throw new Error(error.message);
      }

      // Update auth email/password if provided
      const authUpdate: Record<string, unknown> = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;
      if (Object.keys(authUpdate).length > 0) {
        authUpdate.email_confirm = true;
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdate);
        if (error) throw new Error(error.message);
      }

      // Update role if provided
      if (role !== undefined) {
        // Remove old roles
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        // Assign new role
        if (role) {
          await supabaseAdmin.from("user_roles").insert({ user_id, role });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "deactivate-user") {
      const { user_id } = payload;

      // Check if this is the last admin
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const { data: targetRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .eq("role", "admin");

      if (targetRoles && targetRoles.length > 0) {
        const activeAdmins = adminRoles || [];
        // Check how many active admins exist
        const { data: activeAdminProfiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("is_active", true)
          .in("id", activeAdmins.map(r => r.user_id));

        if (activeAdminProfiles && activeAdminProfiles.length <= 1) {
          return new Response(JSON.stringify({ error: "No se puede desactivar al único admin activo" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      await supabaseAdmin
        .from("profiles")
        .update({ is_active: false })
        .eq("id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-user-email") {
      const { user_id } = payload;
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(user_id);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ email: data.user.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Legacy actions
    if (action === "setup" || action === "update-delivery") {
      return new Response(JSON.stringify({ success: true, message: "Legacy action, no-op" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción no reconocida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
