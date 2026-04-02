"use client";

import { useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Address {
  id: string;
  label: string;
  type: "home" | "work" | "other";
  street: string;
  postalCode: string;
  city: string;
  country: string;
  isDefault: boolean;
}

// Mock addresses - in production these would come from the API
const mockAddresses: Address[] = [
  {
    id: "1",
    label: "Domicile",
    type: "home",
    street: "123 Rue de la Paix",
    postalCode: "75001",
    city: "Paris",
    country: "France",
    isDefault: true,
  },
];

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Plus, Edit, Trash, Home, Building } from "lucide-react";
import { toast } from "sonner";


function AddressesContent() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAddress: Address = {
      id: editingAddress?.id || Date.now().toString(),
      label: formData.get("label") as string,
      type: "home",
      street: formData.get("street") as string,
      postalCode: formData.get("postalCode") as string,
      city: formData.get("city") as string,
      country: formData.get("country") as string,
      isDefault: addresses.length === 0,
    };

    if (editingAddress) {
      setAddresses(
        addresses.map((a) => (a.id === editingAddress.id ? newAddress : a))
      );
      toast.success("Adresse mise à jour");
    } else {
      setAddresses([...addresses, newAddress]);
      toast.success("Adresse ajoutée");
    }

    setIsDialogOpen(false);
    setEditingAddress(null);
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
    toast.success("Adresse supprimée");
  };

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    toast.success("Adresse par défaut mise à jour");
  };

  const getAddressIcon = (type: Address["type"]) => {
    switch (type) {
      case "home":
        return Home;
      case "work":
        return Building;
      default:
        return MapPin;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Mes adresses
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos adresses de livraison
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAddress(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une adresse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Nom de l'adresse</Label>
                <Input
                  id="label"
                  name="label"
                  placeholder="Ex: Domicile, Bureau..."
                  defaultValue={editingAddress?.label}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Adresse</Label>
                <Input
                  id="street"
                  name="street"
                  placeholder="Numéro et nom de rue"
                  defaultValue={editingAddress?.street}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="75001"
                    defaultValue={editingAddress?.postalCode}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Paris"
                    defaultValue={editingAddress?.city}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="France"
                  defaultValue={editingAddress?.country || "France"}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingAddress ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const Icon = getAddressIcon(address.type);
            return (
              <Card
                key={address.id}
                className={address.isDefault ? "border-primary" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {address.label}
                    </CardTitle>
                    {address.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Par défaut
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {address.street}
                    <br />
                    {address.postalCode} {address.city}
                    <br />
                    {address.country}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAddress(address);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    {!address.isDefault && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          Par défaut
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucune adresse enregistrée</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez une adresse pour faciliter vos commandes
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une adresse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <AddressesContent />
    </Suspense>
  );
}
