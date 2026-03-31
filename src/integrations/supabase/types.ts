export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          price_type: string
          reseller_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          price_type?: string
          reseller_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          price_type?: string
          reseller_id?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          delivery_user_id: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          delivery_user_id?: string | null
          id?: string
          order_id: string
          status?: string
        }
        Update: {
          created_at?: string
          delivery_user_id?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
        }
        Relationships: []
      }
      ingredient_batches: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          purchase_date: string
          quantity_remaining: number
          quantity_total: number
          supplier: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          purchase_date?: string
          quantity_remaining: number
          quantity_total: number
          supplier?: string | null
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          purchase_date?: string
          quantity_remaining?: number
          quantity_total?: number
          supplier?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_batches_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          costo_unitario: number
          created_at: string
          id: string
          name: string
          stock_actual: number
          stock_minimo: number
          unit: string
        }
        Insert: {
          costo_unitario?: number
          created_at?: string
          id?: string
          name: string
          stock_actual?: number
          stock_minimo?: number
          unit?: string
        }
        Update: {
          costo_unitario?: number
          created_at?: string
          id?: string
          name?: string
          stock_actual?: number
          stock_minimo?: number
          unit?: string
        }
        Relationships: []
      }
      order_history: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          order_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          cost_snapshot: number | null
          id: string
          margin_snapshot: number | null
          order_id: string
          pricing_tier_applied: string | null
          product_id: string | null
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          cost_snapshot?: number | null
          id?: string
          margin_snapshot?: number | null
          order_id: string
          pricing_tier_applied?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          cost_snapshot?: number | null
          id?: string
          margin_snapshot?: number | null
          order_id?: string
          pricing_tier_applied?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          address_references: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_type: string
          id: string
          payment_method: string
          payment_status: string
          pickup_time: string | null
          reseller_name: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_references?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_type?: string
          id?: string
          payment_method?: string
          payment_status?: string
          pickup_time?: string | null
          reseller_name?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_references?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_type?: string
          id?: string
          payment_method?: string
          payment_status?: string
          pickup_time?: string | null
          reseller_name?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          emoji: string
          id: string
          intermediate_price: number | null
          last_cost_sync_at: string | null
          min_qty_mid_tier: number | null
          min_qty_wholesale: number | null
          name: string
          retail_price: number | null
          target_margin: number | null
          unit: string | null
          unit_cost: number | null
          wholesale_price: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          intermediate_price?: number | null
          last_cost_sync_at?: string | null
          min_qty_mid_tier?: number | null
          min_qty_wholesale?: number | null
          name: string
          retail_price?: number | null
          target_margin?: number | null
          unit?: string | null
          unit_cost?: number | null
          wholesale_price?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          intermediate_price?: number | null
          last_cost_sync_at?: string | null
          min_qty_mid_tier?: number | null
          min_qty_wholesale?: number | null
          name?: string
          retail_price?: number | null
          target_margin?: number | null
          unit?: string | null
          unit_cost?: number | null
          wholesale_price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_percent: number
          id: string
          is_active: boolean
          name: string
          phone: string | null
          staff_status: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_percent?: number
          id: string
          is_active?: boolean
          name?: string
          phone?: string | null
          staff_status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          staff_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          date: string
          id: string
          ingredient_id: string
          quantity: number
          total_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          ingredient_id: string
          quantity?: number
          total_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          ingredient_id?: string
          quantity?: number
          total_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_cost_history: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          new_cost: number
          old_cost: number
          purchase_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          new_cost?: number
          old_cost?: number
          purchase_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          new_cost?: number
          old_cost?: number
          purchase_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_cost_history_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_material_cost_history_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          id: string
          ingredient_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          ingredient_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          id?: string
          ingredient_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          product_id: string | null
          quantity: number
          sale_date: string
          sale_type: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_date?: string
          sale_type?: string
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_date?: string
          sale_type?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "revendedor" | "delivery"
      order_status:
        | "pendiente"
        | "en_produccion"
        | "enviado"
        | "entregado"
        | "listo"
        | "en_delivery"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "revendedor", "delivery"],
      order_status: [
        "pendiente",
        "en_produccion",
        "enviado",
        "entregado",
        "listo",
        "en_delivery",
      ],
    },
  },
} as const
