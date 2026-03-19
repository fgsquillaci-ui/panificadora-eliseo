import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { categories, type Product, WHOLESALE_MIN_QTY } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";

interface Props {
  onAddToCart: (product: Product) => void;
  isLoggedIn?: boolean;
}

const ProductCatalog = ({ onAddToCart, isLoggedIn }: Props) => {
  const [activeCategory, setActiveCategory] = useState<string>("panes");
  const { data: products = [], isLoading } = useProducts();

  const filtered = products.filter((p) => p.category === activeCategory);

  return (
    <section id="productos" className="py-20 px-6">
      <div className="container max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-display font-bold text-center mb-4"
        >
          Nuestros <span className="text-accent">Productos</span>
        </motion.h2>
        <p className="text-center text-muted-foreground font-body mb-6">
          Elegí lo que más te guste y armá tu pedido
        </p>

        {!isLoggedIn && (
          <div className="text-center mb-10">
            <Link
              to="/registro"
              className="inline-block font-body text-sm bg-accent/10 text-accent font-semibold px-5 py-2.5 rounded-full hover:bg-accent/20 transition-colors"
            >
              🎁 ¿Querés descuentos especiales? Registrate gratis
            </Link>
          </div>
        )}
        {isLoggedIn && <div className="mb-10" />}

        {/* Category tabs */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`font-body font-medium px-6 py-2.5 rounded-full text-sm transition-all ${
                activeCategory === cat.id
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
              >
                {/* Emoji visual placeholder */}
                <div className="h-40 bg-secondary flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                  {product.emoji}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-display font-semibold text-lg">{product.name}</h3>
                    <span className="font-body font-bold text-accent text-lg">
                      ${product.price.toLocaleString("es-AR")}{" "}
                    </span>
                  </div>
                  {product.unit && (
                    <span className="text-xs text-muted-foreground font-body">
                      por {product.unit}
                    </span>
                  )}
                  {product.wholesalePrice && (
                    <div className="mt-1 mb-2">
                      <span className="inline-block text-xs font-body font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        Mayorista desde {WHOLESALE_MIN_QTY}u: ${product.wholesalePrice.toLocaleString("es-AR")}
                      </span>
                    </div>
                  )}
                  <p className="text-muted-foreground text-sm font-body mb-4 leading-relaxed">
                    {product.description}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => onAddToCart(product)}
                    className="w-full bg-accent text-accent-foreground font-body font-semibold py-2.5 rounded-full text-sm hover:brightness-110 transition-all"
                  >
                    + Agregar al pedido
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ProductCatalog;
