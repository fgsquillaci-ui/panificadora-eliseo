import { motion } from "framer-motion";

const badges = [
  { emoji: "🏠", text: "Producción casera" },
  { emoji: "📦", text: "Stock diario limitado" },
  { emoji: "📞", text: "Pedidos por encargo" },
];

const TrustSection = () => (
  <section className="py-20 px-6">
    <div className="container max-w-4xl text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-display font-bold mb-10"
      >
        Tu <span className="text-accent">confianza</span> nos importa
      </motion.h2>
      <div className="flex flex-wrap justify-center gap-4">
        {badges.map((b, i) => (
          <motion.div
            key={b.text}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-full px-7 py-3 shadow-sm flex items-center gap-3 font-body font-medium"
          >
            <span className="text-xl">{b.emoji}</span>
            {b.text}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSection;
