import { motion } from "framer-motion";

const values = [
  { emoji: "🤲", title: "Hecho a mano", desc: "Cada pieza amasada con dedicación y cariño artesanal." },
  { emoji: "🌅", title: "Producción diaria", desc: "Horneamos cada mañana para que siempre sea fresco." },
  { emoji: "🌿", title: "Sin conservantes", desc: "Ingredientes simples y naturales, como los de antes." },
  { emoji: "🏠", title: "Hogar y negocios", desc: "Para tu mesa familiar o tu emprendimiento gastronómico." },
];

const ValueProposition = () => (
  <section className="py-20 px-6">
    <div className="container max-w-5xl">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-display font-bold text-center mb-14"
      >
        ¿Por qué <span className="text-accent">Panificadora Eliseo</span>?
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-lg p-8 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-4xl mb-4 block">{v.emoji}</span>
            <h3 className="font-display font-semibold text-lg mb-2">{v.title}</h3>
            <p className="text-muted-foreground text-sm font-body leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ValueProposition;
