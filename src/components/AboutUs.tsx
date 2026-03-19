import { motion } from "framer-motion";
import { Heart, Wheat, Users, Clock } from "lucide-react";

const values = [
  { icon: Wheat, title: "Tradición artesanal", desc: "Recetas que pasan de generación en generación, con el sabor de siempre." },
  { icon: Heart, title: "Pasión por lo que hacemos", desc: "Cada pan que sale del horno lleva dedicación y amor por el oficio." },
  { icon: Users, title: "Compromiso con el barrio", desc: "Somos parte del vecindario y trabajamos para vos todos los días." },
  { icon: Clock, title: "Frescura garantizada", desc: "Elaboración diaria para que siempre recibas productos recién hechos." },
];

const AboutUs = () => (
  <section className="py-20 bg-secondary/30">
    <div className="container px-5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center mb-14"
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
          Quiénes somos
        </h2>
        <p className="font-body text-lg text-muted-foreground leading-relaxed mb-4">
          Somos <span className="text-accent font-semibold">Panificadora Eliseo</span>, una empresa familiar con años de trayectoria llevando pan fresco y productos de calidad a las mesas de nuestros vecinos.
        </p>
        <p className="font-body text-base text-muted-foreground leading-relaxed">
          Nacimos con una idea simple: hacer las cosas bien, con ingredientes de verdad y el cariño de siempre. Creemos que un buen pan puede alegrar el día, y por eso nos levantamos temprano cada mañana para que vos tengas lo mejor en tu mesa.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-card rounded-xl p-6 text-center shadow-sm border"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <v.icon className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display text-base font-bold text-foreground mb-2">{v.title}</h3>
            <p className="font-body text-sm text-muted-foreground">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutUs;
