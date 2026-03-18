import { WHATSAPP_NUMBER } from "@/data/products";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="py-10 px-6 border-t">
    <div className="container max-w-5xl text-center space-y-3">
      <img src={logo} alt="Panificadora Eliseo" className="h-14 mx-auto mb-2" />
      <p className="text-muted-foreground font-body text-sm">
        Pedidos por encargo – Producción diaria
      </p>
      <p className="text-muted-foreground font-body text-sm">
        WhatsApp:{" "}
        <a
          href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`}
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
