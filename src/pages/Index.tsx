import { useState } from "react";
import Hero from "@/components/Hero";
import ValueProposition from "@/components/ValueProposition";
import ProductCatalog from "@/components/ProductCatalog";
import HowItWorks from "@/components/HowItWorks";
import TrustSection from "@/components/TrustSection";
import AboutUs from "@/components/AboutUs";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Cart from "@/components/Cart";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const cart = useCart();
  const { user, profile, signOut } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  const discountPercent = profile?.discount_percent ?? 0;
  const totalPrice = cart.getTotalPrice(profile);

  const scrollToProducts = () => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Header
        totalItems={cart.totalItems}
        bounceKey={cart.bounceKey}
        onCartClick={() => setCartOpen(true)}
        profile={profile}
        isLoggedIn={!!user}
        onSignOut={signOut}
      />
      <Hero onCtaClick={scrollToProducts} />
      <ValueProposition />
      <ProductCatalog onAddToCart={cart.addItem} isLoggedIn={!!user} />
      <div id="como-funciona">
        <HowItWorks />
      </div>
      <TrustSection />
      <div id="quienes-somos">
        <AboutUs />
      </div>
      <FinalCta />
      <Footer />
      <Cart
        items={cart.items}
        totalItems={cart.totalItems}
        subtotal={cart.subtotal}
        totalPrice={totalPrice}
        discountPercent={discountPercent}
        bounceKey={cart.bounceKey}
        isOpen={cartOpen}
        profile={profile}
        onToggle={() => setCartOpen(!cartOpen)}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClear={cart.clearCart}
        getWhatsAppUrl={(checkoutData) => cart.getWhatsAppUrl(profile, checkoutData)}
      />
    </div>
  );
};

export default Index;
