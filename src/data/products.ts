export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "panes" | "especiales" | "dulces";
  emoji: string;
}

export const categories = [
  { id: "panes" as const, name: "Panes", emoji: "🍞" },
  { id: "especiales" as const, name: "Especiales", emoji: "🧀" },
  { id: "dulces" as const, name: "Dulces", emoji: "🥐" },
];

export const products: Product[] = [
  {
    id: "pan-casero",
    name: "Pan Casero",
    description: "El clásico de todos los días, corteza crujiente y miga tierna.",
    price: 1200,
    category: "panes",
    emoji: "🍞",
  },
  {
    id: "pan-de-miga",
    name: "Pan de Miga",
    description: "Suave y esponjoso, ideal para sándwiches y meriendas.",
    price: 1800,
    category: "panes",
    emoji: "🥪",
  },
  {
    id: "pan-integral",
    name: "Pan Integral",
    description: "Con harina integral, más fibra y sabor natural.",
    price: 1500,
    category: "panes",
    emoji: "🌾",
  },
  {
    id: "pan-de-lomo",
    name: "Pan de Lomo",
    description: "Crujiente por fuera, perfecto para tus lomitos.",
    price: 600,
    category: "panes",
    emoji: "🥖",
  },
  {
    id: "prepizzas",
    name: "Prepizzas",
    description: "Listas para ponerle lo que quieras y al horno.",
    price: 900,
    category: "especiales",
    emoji: "🍕",
  },
  {
    id: "chipa",
    name: "Chipá",
    description: "Bolitas de queso calentitas, receta tradicional.",
    price: 1400,
    category: "especiales",
    emoji: "🧀",
  },
  {
    id: "pan-de-queso",
    name: "Pan de Queso",
    description: "Suave y con mucho queso fundido adentro.",
    price: 1600,
    category: "especiales",
    emoji: "🫓",
  },
  {
    id: "medialunas",
    name: "Medialunas",
    description: "De manteca, doradas y dulces. Perfectas con mate.",
    price: 1200,
    category: "dulces",
    emoji: "🥐",
  },
  {
    id: "bizcochitos",
    name: "Bizcochitos",
    description: "De grasa, crocantes y con sabor a hogar.",
    price: 1000,
    category: "dulces",
    emoji: "🍪",
  },
  {
    id: "rosca-de-pascua",
    name: "Rosca de Pascua",
    description: "Dulce, esponjosa y con frutas. Edición especial.",
    price: 3500,
    category: "dulces",
    emoji: "🎄",
  },
];

export const WHATSAPP_NUMBER = "5492612563653";
