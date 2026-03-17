import { motion } from "framer-motion";

const steps = [
  { emoji: "👆", title: "Elegí productos", desc: "Recorré nuestro catálogo y agregá lo que quieras." },
  { emoji: "📋", title: "Armá tu pedido", desc: "Revisá cantidades y ajustá desde el carrito." },
  { emoji: "📱", title: "Enviá por WhatsApp", desc: "Con un toque se arma el mensaje automáticamente." },
  { emoji: "🚚", title: "Coordinamos entrega", desc: "Te confirmamos y coordinamos cómo y cuándo." },
];

const HowItWorks = () => (
  <section className="py-20 px-6 bg-secondary/50">
    <div className="container max-w-5xl">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-display font-bold text-center mb-14"
      >
        Cómo <span className="text-accent">funciona</span>
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
              {s.emoji}
            </div>
            <span className="text-accent font-body font-bold text-xs tracking-widest uppercase">
              Paso {i + 1}
            </span>
            <h3 className="font-display font-semibold text-lg mt-2 mb-2">{s.title}</h3>
            <p className="text-muted-foreground text-sm font-body leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
