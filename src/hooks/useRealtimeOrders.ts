import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type OrderStatus = "pendiente" | "en_produccion" | "listo" | "en_delivery" | "entregado";

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  delivery_type: string;
  customer_name: string;
  customer_phone: string | null;
  address: string | null;
  address_references: string | null;
  reseller_name: string | null;
  created_by: string;
  user_id: string | null;
}

interface UseRealtimeOrdersOptions {
  userId?: string;
  statusFilter?: OrderStatus;
  limit?: number;
  deliveryTypeFilter?: string;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (options.userId) {
      query = query.eq("user_id", options.userId);
    }
    if (options.statusFilter) {
      query = query.eq("status", options.statusFilter);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data } = await query;
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, [options.userId, options.statusFilter, options.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const channelName = `orders-rt-${options.userId ?? "all"}-${options.statusFilter ?? "all"}-${options.limit ?? "none"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as Order;
          // Apply client-side filters
          if (options.userId && newOrder.user_id !== options.userId) return;
          if (options.statusFilter && newOrder.status !== options.statusFilter) return;
          setOrders((prev) => [newOrder, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) => {
            // If filtering by userId and doesn't match, remove it
            if (options.userId && updated.user_id !== options.userId) {
              return prev.filter((o) => o.id !== updated.id);
            }
            // If filtering by status and doesn't match, remove it
            if (options.statusFilter && updated.status !== options.statusFilter) {
              return prev.filter((o) => o.id !== updated.id);
            }
            // Update existing or add if new
            const exists = prev.find((o) => o.id === updated.id);
            if (exists) {
              return prev.map((o) => (o.id === updated.id ? updated : o));
            }
            return [updated, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.userId, options.statusFilter]);

  return { orders, loading, refetch: fetchOrders };
}
