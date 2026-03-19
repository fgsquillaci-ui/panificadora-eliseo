import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "revendedor" | "delivery";

export function useRole(userId: string | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async (uid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    setRoles((data || []).map((r) => r.role as AppRole));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchRoles(userId);
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [userId, fetchRoles]);

  const hasRole = useCallback(
    (r: AppRole) => roles.includes(r),
    [roles]
  );

  // Keep backward-compat: `role` returns the first role or null
  const role = roles.length > 0 ? roles[0] : null;

  return { role, roles, loading, hasRole, refetch: () => userId ? fetchRoles(userId) : Promise.resolve() };
}
