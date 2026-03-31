export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  wholesalePrice?: number;
  intermediatePrice?: number;
  minQtyMidTier?: number;
  minQtyWholesale?: number;
  unit?: string;
  category: "panes" | "especiales" | "tortilleria";
  emoji: string;
}

export const WHOLESALE_MIN_QTY = 10;

export const categories = [
  { id: "panes" as const, name: "Panes", emoji: "🍞" },
  { id: "especiales" as const, name: "Pizzas & Especiales", emoji: "🍕" },
  { id: "tortilleria" as const, name: "Tortitas", emoji: "🫓" },
];

/** @deprecated Use getUnitPrice from src/lib/pricing.ts instead */
export function getEffectivePrice(product: Product, quantity: number): number {
  if (quantity >= WHOLESALE_MIN_QTY && product.wholesalePrice) {
    return product.wholesalePrice;
  }
  return product.price;
}

export const products: Product[] = [
  {
    id: "ciabattas",
    name: "Ciabattas (x3 pack)",
    description: "Pan italiano crujiente por fuera y esponjoso por dentro. Pack de 3 unidades.",
    price: 3000,
    wholesalePrice: 2100,
    unit: "pack x3",
    category: "panes",
    emoji: "🥖",
  },
  {
    id: "focaccia",
    name: "Focaccia",
    description: "Clásica focaccia italiana con aceite de oliva y hierbas.",
    price: 5500,
    wholesalePrice: 3300,
    category: "panes",
    emoji: "🫓",
  },
  {
    id: "pan-casero",
    name: "Pan Casero",
    description: "El clásico de todos los días, corteza crujiente y miga tierna.",
    price: 2000,
    wholesalePrice: 1100,
    category: "panes",
    emoji: "🍞",
  },
  {
    id: "pan-de-ajo",
    name: "Pan de Ajo",
    description: "Aromático y sabroso, ideal para acompañar pastas y carnes.",
    price: 2000,
    wholesalePrice: 1150,
    category: "panes",
    emoji: "🧄",
  },
  {
    id: "pan-de-hamburguesa",
    name: "Pan de Hamburguesa",
    description: "Suave y esponjoso, perfecto para tus hamburguesas.",
    price: 1000,
    wholesalePrice: 700,
    category: "panes",
    emoji: "🍔",
  },
  {
    id: "pan-de-lomo-15",
    name: "Pan de Lomo 15cm",
    description: "Crujiente por fuera, perfecto para tus lomitos.",
    price: 1000,
    wholesalePrice: 400,
    category: "panes",
    emoji: "🥖",
  },
  {
    id: "pan-de-lomo-30",
    name: "Pan de Lomo 30cm",
    description: "Versión grande para lomitos generosos.",
    price: 1100,
    wholesalePrice: 700,
    category: "panes",
    emoji: "🥖",
  },
  {
    id: "pan-de-pernil",
    name: "Pan de Pernil",
    description: "Ideal para sándwiches de pernil y fiambres.",
    price: 250,
    category: "panes",
    emoji: "🥪",
  },
  {
    id: "pizzetas-250-18",
    name: "Pizzetas 250gr (18cm)",
    description: "Pizzetas individuales listas para ponerle lo que quieras.",
    price: 700,
    wholesalePrice: 450,
    category: "especiales",
    emoji: "🍕",
  },
  {
    id: "pizzetas-80-12u",
    name: "Pizzetas 80gr (8cm) x12",
    description: "Pack de 12 mini pizzetas, ideales para eventos.",
    price: 4000,
    wholesalePrice: 2500,
    unit: "pack x12",
    category: "especiales",
    emoji: "🍕",
  },
  {
    id: "pizzetas-80-6u",
    name: "Pizzetas 80gr (8cm) x6",
    description: "Pack de 6 mini pizzetas para compartir.",
    price: 2000,
    unit: "pack x6",
    category: "especiales",
    emoji: "🍕",
  },
  {
    id: "prepizzas",
    name: "Prepizzas",
    description: "Listas para ponerle lo que quieras y al horno.",
    price: 1200,
    wholesalePrice: 800,
    category: "especiales",
    emoji: "🍕",
  },
  {
    id: "tortas-pinchadas",
    name: "Tortas Pinchadas",
    description: "Clásicas tortas pinchadas, vendidas por docena.",
    price: 3500,
    wholesalePrice: 2500,
    unit: "docena",
    category: "tortilleria",
    emoji: "🫓",
  },
  {
    id: "tortas-raspadas",
    name: "Tortas Raspadas",
    description: "Tortas raspadas tradicionales, por docena.",
    price: 3500,
    wholesalePrice: 2500,
    unit: "docena",
    category: "tortilleria",
    emoji: "🫓",
  },
  {
    id: "tortas-chicharron",
    name: "Tortas de Chicharrón",
    description: "Con chicharrón crocante, sabor único. Por docena.",
    price: 3500,
    wholesalePrice: 2500,
    unit: "docena",
    category: "tortilleria",
    emoji: "🥓",
  },
];

export const WHATSAPP_NUMBER = "5492612563653";
