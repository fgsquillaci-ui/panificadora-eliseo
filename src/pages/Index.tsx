import { useState } from "react";
import Hero from "@/components/Hero";
import ValueProposition from "@/components/ValueProposition";
import ProductCatalog from "@/components/ProductCatalog";
import HowItWorks from "@/components/HowItWorks";
import TrustSection from "@/components/TrustSection";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Cart from "@/components/Cart";
import { useCart } from "@/hooks/useCart";

const Index = () => {
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const scrollToProducts = () => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Header
        totalItems={cart.totalItems}
        bounceKey={cart.bounceKey}
        onCartClick={() => setCartOpen(true)}
      />
      <Hero onCtaClick={scrollToProducts} />
      <ValueProposition />
      <ProductCatalog onAddToCart={cart.addItem} />
      <div id="como-funciona">
        <HowItWorks />
      </div>
      <TrustSection />
      <FinalCta />
      <Footer />
      <Cart
        items={cart.items}
        totalItems={cart.totalItems}
        totalPrice={cart.totalPrice}
        bounceKey={cart.bounceKey}
        isOpen={cartOpen}
        onToggle={() => setCartOpen(!cartOpen)}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClear={cart.clearCart}
        whatsAppUrl={cart.getWhatsAppUrl()}
      />
    </div>
  );
};

export default Index;
