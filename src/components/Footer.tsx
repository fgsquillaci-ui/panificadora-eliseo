import { WHATSAPP_NUMBER } from "@/data/products";

const Footer = () => (
  <footer className="py-10 px-6 border-t">
    <div className="container max-w-5xl text-center space-y-3">
      <h3 className="font-display font-bold text-xl">Panificadora Eliseo</h3>
      <p className="text-muted-foreground font-body text-sm">
        Pedidos por encargo – Producción diaria
      </p>
      <p className="text-muted-foreground font-body text-sm">
        WhatsApp:{" "}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          261-256-3653
        </a>
      </p>
      <p className="text-muted-foreground/60 font-body text-xs pt-4">
        © {new Date().getFullYear()} Panificadora Eliseo. Todos los derechos reservados.
      </p>
    </div>
  </footer>
);

export default Footer;
