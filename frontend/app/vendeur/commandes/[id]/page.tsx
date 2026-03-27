"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSellerOrder, useUpdateOrderStatus } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStepBar } from "@/components/OrderStepBar";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const statusOptions = [
  { value: "en_attente", label: "En attente" },
  { value: "en_preparation", label: "En préparation" },
  { value: "en_livraison", label: "En livraison" },
  { value: "livree", label: "Livrée" },
];

const orderSteps = [
  { label: "Confirmée", status: "en_attente" },
  { label: "En préparation", status: "en_preparation" },
  { label: "Expédiée", status: "en_livraison" },
  { label: "Livrée", status: "livree" },
];

export default function VendorOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading } = useSellerOrder(orderId);
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-heading font-semibold mb-2">
          Commande introuvable
        </h2>
        <Button asChild variant="outline">
          <Link href="/vendeur/commandes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux commandes
          </Link>
        </Button>
      </div>
    );
  }

  const currentStepIndex = orderSteps.findIndex(
    (step) => step.status === order.status
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendeur/commandes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Commande #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.createdAt), "d MMMM yyyy 'à' HH:mm", {
                locale: fr,
              })}
            </p>
          </div>
        </div>
        <Select value={order.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Order Progress */}
      <Card>
        <CardContent className="py-6">
          <OrderStepBar
            steps={orderSteps.map((s) => s.label)}
            currentStep={currentStepIndex + 1}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg border"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantité: {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prix unitaire: {item.priceAtPurchase?.toFixed(2)} €
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {((item.priceAtPurchase || 0) * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Order Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{order.total?.toFixed(2) || "0.00"} €</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">
                    {order.total?.toFixed(2) || "0.00"} €
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {order.order?.user?.firstName} {order.order?.user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.order?.user?.email}
              </p>
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
                {order.order?.shippingAddress?.street}
                <br />
                {order.order?.shippingAddress?.postalCode}{" "}
                {order.order?.shippingAddress?.city}
                <br />
                {order.order?.shippingAddress?.country}
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.status === "en_attente" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("en_preparation")}
                >
                  Commencer la préparation
                </Button>
              )}
              {order.status === "en_preparation" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("en_livraison")}
                >
                  Marquer comme expédiée
                </Button>
              )}
              {order.status === "en_livraison" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("livree")}
                >
                  Marquer comme livrée
                </Button>
              )}
              {order.status === "livree" && (
                <p className="text-sm text-center text-agora-success">
                  Commande complétée
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
