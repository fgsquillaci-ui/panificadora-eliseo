import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  totalItems: number;
  bounceKey: number;
  onCartClick: () => void;
}

const Header = ({ totalItems, bounceKey, onCartClick }: Props) => (
  <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b">
    <div className="container flex items-center justify-between h-16 px-5">
      <a href="#" className="font-display font-bold text-lg">
        Panificadora <span className="text-accent">Eliseo</span>
      </a>
      <nav className="hidden md:flex gap-6 font-body text-sm">
        <a href="#productos" className="hover:text-accent transition-colors">Productos</a>
        <a href="#como-funciona" className="hover:text-accent transition-colors">Cómo funciona</a>
      </nav>
      <button onClick={onCartClick} className="relative p-2 hover:bg-secondary rounded-full transition-colors">
        <motion.div
          key={bounceKey}
          animate={bounceKey > 0 ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ShoppingCart className="w-5 h-5" />
        </motion.div>
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  </header>
);

export default Header;
