import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/data/products";

const FinalCta = () => (
  <section className="py-20 px-6 bg-primary">
    <div className="container max-w-3xl text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4"
      >
        Hacé tu pedido <span className="italic text-accent">ahora</span>
      </motion.h2>
      <p className="text-primary-foreground/80 font-body mb-10">
        Escribinos por WhatsApp y te respondemos al toque
      </p>
      <motion.a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quiero hacer un pedido")}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-3 bg-whatsapp text-whatsapp-foreground font-body font-bold text-lg px-12 py-5 rounded-full shadow-xl hover:shadow-2xl transition-shadow"
      >
        <MessageCircle className="w-6 h-6" />
        Pedir por WhatsApp
      </motion.a>
    </div>
  </section>
);

export default FinalCta;
