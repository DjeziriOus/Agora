"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, MapPin, CreditCard, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useOrder } from "@/hooks/useApi";
import { OrderStepBar } from "@/components/OrderStepBar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  en_attente: "En attente",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-heading font-semibold mb-2">
          Commande introuvable
        </h2>
        <p className="text-muted-foreground mb-4">
          {"Nous n'avons pas pu trouver cette commande."}
        </p>
        <Button asChild variant="outline">
          <Link href="/compte/commandes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux commandes
          </Link>
        </Button>
      </div>
    );
  }

  const orderSteps = [
    { label: "Confirmée", status: "en_attente" },
    { label: "En préparation", status: "en_preparation" },
    { label: "Expédiée", status: "en_livraison" },
    { label: "Livrée", status: "livree" },
  ];

  const currentStepIndex = orderSteps.findIndex(
    (step) => step.status === order.status
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compte/commandes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Commande #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Passée le{" "}
            {format(new Date(order.createdAt), "d MMMM yyyy 'à' HH:mm", {
              locale: fr,
            })}
          </p>
        </div>
      </div>

      {/* Order Progress */}
      {order.status !== "annulee" && (
        <Card>
          <CardContent className="py-6">
            <OrderStepBar
              steps={orderSteps.map((s) => s.label)}
              currentStep={currentStepIndex + 1}
            />
          </CardContent>
        </Card>
      )}

      {order.status === "annulee" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-destructive font-medium text-center">
              Cette commande a été annulée
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          {order.subOrders?.map((subOrder) => (
            <Card key={subOrder.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {subOrder.store?.name || "Boutique"}
                  </CardTitle>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      subOrder.status === "livree"
                        ? "bg-agora-success/10 text-agora-success"
                        : subOrder.status === "en_livraison"
                        ? "bg-primary/10 text-primary"
                        : "bg-agora-warning/10 text-agora-warning"
                    }`}
                  >
                    {statusLabels[subOrder.status] || subOrder.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/produit/${item.product.id}`}
                          className="font-medium hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Quantité: {item.quantity}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {item.priceAtPurchase.toFixed(2)} € / unité
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {(item.priceAtPurchase * item.quantity).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>
                  {(order.total - (order.shippingCost || 0)).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span>{order.shippingCost?.toFixed(2) || "0.00"} €</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{order.total.toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress?.street}
                <br />
                {order.shippingAddress?.postalCode}{" "}
                {order.shippingAddress?.city}
                <br />
                {order.shippingAddress?.country}
              </p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {order.paymentMethod === "card"
                  ? "Carte bancaire"
                  : order.paymentMethod === "paypal"
                  ? "PayPal"
                  : "Paiement en ligne"}
              </p>
              <p className="text-sm text-agora-success mt-1">Paiement validé</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
