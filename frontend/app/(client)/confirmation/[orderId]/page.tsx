"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-4">
            Commande introuvable
          </h1>
          <p className="text-muted-foreground mb-6">
            {"Nous n'avons pas pu trouver cette commande."}
          </p>
          <Button asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-agora-success/10 mb-4">
            <CheckCircle className="h-8 w-8 text-agora-success" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
            Commande confirmée !
          </h1>
          <p className="text-muted-foreground">
            Merci pour votre achat. Votre commande #{order.id.slice(0, 8)} a été enregistrée.
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Récapitulatif de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date de commande</span>
              <span className="font-medium">
                {format(new Date(order.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Numéro de commande</span>
              <span className="font-mono text-xs">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Statut</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-agora-warning/10 text-agora-warning">
                En attente de traitement
              </span>
            </div>

            <hr className="my-4" />

            {/* Items */}
            <div className="space-y-3">
              {order.subOrders?.map((subOrder) =>
                subOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-muted-foreground">Quantité: {item.quantity}</p>
                    </div>
                    <span className="font-medium">
                      {(item.priceAtPurchase * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))
              )}
            </div>

            <hr className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{(order.total - (order.shippingCost || 0)).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais de livraison</span>
                <span>{order.shippingCost?.toFixed(2) || "0.00"} €</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Adresse de livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress?.street}<br />
              {order.shippingAddress?.postalCode} {order.shippingAddress?.city}<br />
              {order.shippingAddress?.country}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/compte/commandes">
              Voir mes commandes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/catalogue">
              Continuer mes achats
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
