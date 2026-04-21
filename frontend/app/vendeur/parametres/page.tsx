"use client";

import { AccountProfileSettingsCard } from "@/components/AccountProfileSettingsCard";
import { AccountPasswordSettingsCard } from "@/components/AccountPasswordSettingsCard";
import { AccountDangerZoneCard } from "@/components/AccountDangerZoneCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export default function VendorSettingsPage() {
  const handleSaveNotifications = () => {
    toast.success("Préférences de notification mises à jour");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <AccountProfileSettingsCard />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Gérez vos préférences de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nouvelles commandes</p>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification pour chaque nouvelle commande
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Stock faible</p>
              <p className="text-sm text-muted-foreground">
                {"Être alerté quand un produit est en stock faible"}
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Avis clients</p>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification pour chaque nouvel avis
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Newsletter Agora</p>
              <p className="text-sm text-muted-foreground">
                Recevoir les actualités et conseils vendeur
              </p>
            </div>
            <Switch />
          </div>
          <Button onClick={handleSaveNotifications}>Enregistrer</Button>
        </CardContent>
      </Card>

      <AccountPasswordSettingsCard />

      <AccountDangerZoneCard />
    </div>
  );
}
