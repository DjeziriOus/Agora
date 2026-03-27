"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Check,
  Lock,
  Truck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type CheckoutStep = "shipping" | "payment" | "confirmation";

interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  nameOnCard: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    nameOnCard: "",
  });

  const steps: { key: CheckoutStep; label: string; icon: React.ElementType }[] = [
    { key: "shipping", label: "Livraison", icon: MapPin },
    { key: "payment", label: "Paiement", icon: CreditCard },
    { key: "confirmation", label: "Confirmation", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const isShippingValid = useMemo(() => {
    return (
      shippingInfo.firstName.trim() !== "" &&
      shippingInfo.lastName.trim() !== "" &&
      shippingInfo.address.trim() !== "" &&
      shippingInfo.city.trim() !== "" &&
      shippingInfo.postalCode.trim() !== "" &&
      shippingInfo.phone.trim() !== ""
    );
  }, [shippingInfo]);

  const isPaymentValid = useMemo(() => {
    return (
      paymentInfo.cardNumber.replace(/\s/g, "").length >= 16 &&
      paymentInfo.expiryDate.length >= 5 &&
      paymentInfo.cvc.length >= 3 &&
      paymentInfo.nameOnCard.trim() !== ""
    );
  }, [paymentInfo]);

  // Redirect to cart if empty (except on confirmation)
  if (items.length === 0 && currentStep !== "confirmation") {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--agora-ink)] mb-4">
            Votre panier est vide
          </h1>
          <Link
            href="/catalogue"
            className="text-[var(--agora-primary)] hover:underline"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    );
  }

  const handleNextStep = async () => {
    if (currentStep === "shipping" && isShippingValid) {
      setCurrentStep("payment");
    } else if (currentStep === "payment" && isPaymentValid) {
      // Process payment
      setIsProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const newOrderId = `AGO-${Date.now().toString(36).toUpperCase()}`;
      setOrderId(newOrderId);
      clearCart();
      setIsProcessing(false);
      setCurrentStep("confirmation");
    }
  };

  const handlePrevStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("shipping");
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, "").replace(/\D/g, "");
    const matches = v.match(/\d{1,4}/g);
    return matches ? matches.join(" ").slice(0, 19) : "";
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  return (
    <div className="min-h-screen bg-[var(--agora-bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back to Cart */}
        {currentStep !== "confirmation" && (
          <Link
            href="/panier"
            className="inline-flex items-center gap-1 text-sm text-[var(--agora-mid)] hover:text-[var(--agora-primary)] mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour au panier
          </Link>
        )}

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--agora-line)]">
              <div
                className="h-full bg-[var(--agora-primary)] transition-all duration-300"
                style={{
                  width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Steps */}
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.key}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isComplete
                        ? "bg-[var(--agora-green)] text-white"
                        : isActive
                        ? "bg-[var(--agora-primary)] text-white"
                        : "bg-[var(--agora-surface)] border-2 border-[var(--agora-line)] text-[var(--agora-mid)]"
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isActive
                        ? "text-[var(--agora-primary)]"
                        : isComplete
                        ? "text-[var(--agora-green)]"
                        : "text-[var(--agora-mid)]"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Step */}
            {currentStep === "shipping" && (
              <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-6">
                <h2 className="font-display font-semibold text-xl text-[var(--agora-ink)] mb-6">
                  Adresse de livraison
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.firstName}
                      onChange={(e) =>
                        setShippingInfo((s) => ({
                          ...s,
                          firstName: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.lastName}
                      onChange={(e) =>
                        setShippingInfo((s) => ({
                          ...s,
                          lastName: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="Dupont"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.address}
                      onChange={(e) =>
                        setShippingInfo((s) => ({
                          ...s,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="123 Rue de la Paix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) =>
                        setShippingInfo((s) => ({ ...s, city: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="Paris"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.postalCode}
                      onChange={(e) =>
                        setShippingInfo((s) => ({
                          ...s,
                          postalCode: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="75001"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) =>
                        setShippingInfo((s) => ({
                          ...s,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="mt-6 pt-6 border-t border-[var(--agora-line)]">
                  <h3 className="font-medium text-[var(--agora-ink)] mb-3">
                    Mode de livraison
                  </h3>
                  <div className="p-4 border-2 border-[var(--agora-primary)] bg-[var(--agora-primary)]/5 rounded-[var(--radius-md)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--agora-primary)]/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-[var(--agora-primary)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--agora-ink)]">
                        Livraison standard
                      </p>
                      <p className="text-sm text-[var(--agora-mid)]">
                        3-5 jours ouvrés
                      </p>
                    </div>
                    <span className="font-medium text-[var(--agora-green)]">
                      Gratuite
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === "payment" && (
              <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-semibold text-xl text-[var(--agora-ink)]">
                    Paiement sécurisé
                  </h2>
                  <div className="flex items-center gap-1 text-[var(--agora-green)] text-sm">
                    <Lock className="w-4 h-4" />
                    <span>SSL 256-bit</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Numéro de carte
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cardNumber}
                      onChange={(e) =>
                        setPaymentInfo((p) => ({
                          ...p,
                          cardNumber: formatCardNumber(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                        Date d&apos;expiration
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.expiryDate}
                        onChange={(e) =>
                          setPaymentInfo((p) => ({
                            ...p,
                            expiryDate: formatExpiryDate(e.target.value),
                          }))
                        }
                        className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cvc}
                        onChange={(e) =>
                          setPaymentInfo((p) => ({
                            ...p,
                            cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--agora-ink)] mb-1.5">
                      Nom sur la carte
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.nameOnCard}
                      onChange={(e) =>
                        setPaymentInfo((p) => ({
                          ...p,
                          nameOnCard: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-[var(--agora-ink)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20"
                      placeholder="JEAN DUPONT"
                    />
                  </div>
                </div>

                {/* Shipping Summary */}
                <div className="mt-6 pt-6 border-t border-[var(--agora-line)]">
                  <h3 className="font-medium text-[var(--agora-ink)] mb-3">
                    Adresse de livraison
                  </h3>
                  <div className="p-4 bg-[var(--agora-accent)] rounded-[var(--radius-md)]">
                    <p className="text-[var(--agora-ink)]">
                      {shippingInfo.firstName} {shippingInfo.lastName}
                    </p>
                    <p className="text-sm text-[var(--agora-mid)]">
                      {shippingInfo.address}
                    </p>
                    <p className="text-sm text-[var(--agora-mid)]">
                      {shippingInfo.postalCode} {shippingInfo.city}
                    </p>
                    <p className="text-sm text-[var(--agora-mid)]">
                      {shippingInfo.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Step */}
            {currentStep === "confirmation" && orderId && (
              <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-[var(--agora-green)]/10 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-[var(--agora-green)]" />
                </div>
                <h2 className="font-display font-bold text-2xl text-[var(--agora-ink)] mb-2">
                  Merci pour votre commande !
                </h2>
                <p className="text-[var(--agora-mid)] mb-4">
                  Votre commande a été confirmée et sera expédiée sous peu.
                </p>
                <div className="inline-block px-4 py-2 bg-[var(--agora-accent)] rounded-[var(--radius-md)] mb-6">
                  <p className="text-sm text-[var(--agora-mid)]">
                    Numéro de commande
                  </p>
                  <p className="font-mono font-bold text-lg text-[var(--agora-ink)]">
                    {orderId}
                  </p>
                </div>
                <p className="text-sm text-[var(--agora-mid)] mb-6">
                  Un email de confirmation a été envoyé à votre adresse.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/catalogue"
                    className="px-6 py-3 bg-[var(--agora-primary)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--agora-primary-hover)] transition-colors"
                  >
                    Continuer mes achats
                  </Link>
                  {isAuthenticated && (
                    <Link
                      href="/compte/commandes"
                      className="px-6 py-3 border border-[var(--agora-line)] text-[var(--agora-mid)] rounded-[var(--radius-md)] font-medium hover:border-[var(--agora-primary)] hover:text-[var(--agora-primary)] transition-colors"
                    >
                      Voir mes commandes
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep !== "confirmation" && (
              <div className="flex items-center justify-between mt-6">
                {currentStep === "payment" ? (
                  <button
                    onClick={handlePrevStep}
                    className="inline-flex items-center gap-1 px-4 py-2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                ) : (
                  <div />
                )}
                <button
                  onClick={handleNextStep}
                  disabled={
                    (currentStep === "shipping" && !isShippingValid) ||
                    (currentStep === "payment" && !isPaymentValid) ||
                    isProcessing
                  }
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] font-medium transition-colors",
                    (currentStep === "shipping" && !isShippingValid) ||
                    (currentStep === "payment" && !isPaymentValid)
                      ? "bg-[var(--agora-line)] text-[var(--agora-text-disabled)] cursor-not-allowed"
                      : "bg-[var(--agora-primary)] text-white hover:bg-[var(--agora-primary-hover)]"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Traitement...
                    </>
                  ) : currentStep === "payment" ? (
                    <>
                      Payer {total.toFixed(2).replace(".", ",")} €
                      <Lock className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continuer
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep !== "confirmation" && (
            <div className="lg:col-span-1">
              <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-6 sticky top-24">
                <h3 className="font-display font-semibold text-lg text-[var(--agora-ink)] mb-4">
                  Votre commande
                </h3>

                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="relative w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--agora-accent)] shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--agora-primary)] text-white text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--agora-ink)] line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-[var(--agora-mid)]">
                          {item.storeName}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[var(--agora-ink)]">
                        {(item.price * item.quantity)
                          .toFixed(2)
                          .replace(".", ",")} €
                      </p>
                    </div>
                  ))}
                </div>

                <hr className="my-4 border-[var(--agora-line)]" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--agora-mid)]">Sous-total</span>
                    <span className="text-[var(--agora-ink)]">
                      {total.toFixed(2).replace(".", ",")} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--agora-mid)]">Livraison</span>
                    <span className="text-[var(--agora-green)]">Gratuite</span>
                  </div>
                </div>

                <hr className="my-4 border-[var(--agora-line)]" />

                <div className="flex justify-between">
                  <span className="font-semibold text-[var(--agora-ink)]">
                    Total
                  </span>
                  <span className="font-display text-xl font-bold text-[var(--agora-ink)]">
                    {total.toFixed(2).replace(".", ",")} €
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
