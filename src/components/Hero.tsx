import { motion } from "framer-motion";
import heroBread from "@/assets/hero-bread.jpg";

const Hero = ({ onCtaClick }: { onCtaClick: () => void }) => {
  return (
    <section className="relative w-full h-screen flex items-end justify-center text-center pb-20">
      {/* Background — la imagen YA contiene el logo integrado */}
      <div className="absolute inset-0">
        <img
          src={heroBread}
          alt="Panificadora Eliseo – Pan artesanal"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content flotante en la parte inferior */}
      <div className="relative z-10 px-6 max-w-2xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg md:text-xl font-body font-light mb-8"
          style={{ color: "rgba(244, 237, 228, 0.9)" }}
        >
          Pan fresco todos los días, sin conservantes
        </motion.p>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
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
