ALTER TABLE products ADD COLUMN IF NOT EXISTS min_qty_mid_tier integer DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_qty_wholesale integer DEFAULT 10;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pricing_tier_applied text;