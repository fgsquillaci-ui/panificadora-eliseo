import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "revendedor" | "delivery";

export function useRole(userId: string | undefined) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (uid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .limit(1)
      .single();
    setRole((data?.role as AppRole) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchRole(userId);
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [userId, fetchRole]);

  const hasRole = useCallback(
    (r: AppRole) => role === r,
    [role]
  );

  return { role, loading, hasRole, refetch: () => userId ? fetchRole(userId) : Promise.resolve() };
}
