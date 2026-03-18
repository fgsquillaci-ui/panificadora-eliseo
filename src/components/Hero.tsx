import { motion } from "framer-motion";
import heroBread from "@/assets/hero-bread.jpg";
import logo from "@/assets/logo.png";

const Hero = ({ onCtaClick }: { onCtaClick: () => void }) => {
  return (
    <section className="relative w-full h-[70vh] flex items-center justify-center text-center">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBread}
          alt="Panificadora Eliseo – Pan artesanal"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 max-w-2xl mx-auto">
        {/* Logo integrado */}
        <motion.img
          src={logo}
          alt="Panificadora Eliseo"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ duration: 1 }}
          className="mx-auto w-64 md:w-80 drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)] mix-blend-screen"
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-4 text-sm tracking-widest"
          style={{ color: "#D6B37A" }}
        >
          CALIDAD ARTESANAL
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-4 text-lg md:text-xl font-body font-light"
          style={{ color: "rgba(244, 237, 228, 0.9)" }}
        >
          Pan fresco todos los días, sin conservantes
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCtaClick}
          className="mt-8 bg-whatsapp text-whatsapp-foreground font-body font-semibold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          🛒 Pedir por WhatsApp
        </motion.button>
      </div>
    </section>
  );
};

export default Hero;
