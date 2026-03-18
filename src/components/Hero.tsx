import { motion } from "framer-motion";
import heroBread from "@/assets/hero-bread.jpg";
import logo from "@/assets/logo.png";

const Hero = ({ onCtaClick }: { onCtaClick: () => void }) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroBread}
          alt="Pan artesanal recién horneado"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(30,20%,15%)]/30 via-transparent to-[hsl(30,20%,10%)]/50" />
      </div>
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.img
          src={logo}
          alt="Panificadora Eliseo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto h-40 md:h-56 lg:h-64 w-auto mb-8 drop-shadow-2xl"
        />
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
