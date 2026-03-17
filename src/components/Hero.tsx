import { motion } from "framer-motion";
import heroBread from "@/assets/hero-bread.jpg";

const Hero = ({ onCtaClick }: { onCtaClick: () => void }) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroBread}
          alt="Pan artesanal recién horneado"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/80" />
      </div>
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-accent font-body text-sm tracking-[0.3em] uppercase mb-4"
        >
          Panificadora Eliseo
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground leading-tight mb-6"
        >
          Pan de todos los días,{" "}
          <span className="italic text-accent">como en casa</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-primary-foreground/90 font-body font-light mb-10"
        >
          Pan fresco todos los días, sin conservantes
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCtaClick}
          className="bg-whatsapp text-whatsapp-foreground font-body font-semibold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          🛒 Pedir por WhatsApp
        </motion.button>
      </div>
    </section>
  );
};

export default Hero;
