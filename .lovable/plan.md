

## Security Fix: manage-users auth bypass

### Change: `supabase/functions/manage-users/index.ts`

Replace lines 19-37 (the current `if (authHeader)` block) with mandatory auth checks, keeping CORS preflight first:

```typescript
// Line 10-11 stays: CORS preflight (already exists)
if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}

// Lines 19-37 replaced with:
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
```

### What changes
- Auth is now **mandatory** — no request can skip verification
- 401 for missing/invalid token, 403 with "Acceso denegado" for non-admin callers
- CORS preflight stays as the first handler

### What stays the same
- All action handlers (create-user, update-user, pause-user, etc.)
- CORS headers definition
- Supabase admin client creation
- No database changes

