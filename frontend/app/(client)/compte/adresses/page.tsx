"use client";

import { useState, Suspense, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Address {
  _id?: string;
  recipientName: string;
  phone: string;
  addressLabel: "home" | "work" | "other";
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Mock addresses - in production these would come from the API
const mockAddresses: Address[] = [
  {
    _id: "1",
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch address list from backend
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5001/api/addresses", {
      credentials: "include"
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error loading addresses");
        return res.json();
      })
      .then((data) => setAddresses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Save (create/edit)
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAddress: Omit<Address, "id"> = {
      recipientName: formData.get("recipientName") as string,
      phone: formData.get("phone") as string,
      addressLabel: formData.get("addressLabel") as "home" | "work" | "other",
      addressLine: formData.get("addressLine") as string,
      city: formData.get("city") as string,
      province: formData.get("province") as string,
      postalCode: formData.get("postalCode") as string,
      country: formData.get("country") as string,
      isDefault: addresses.length === 0,
    };
    try {
      setLoading(true);
      if (editingAddress) {
        // Edit
        const res = await fetch(`http://localhost:5001/api/addresses/${editingAddress._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAddress),
          credentials: "include"
        });
        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 409) {
            throw new Error(errorData.error || "地址已经存在");
          }
          throw new Error(errorData.error || "Error updating address");
        }
        toast.success("Address updated");
      } else {
        // Create
        const res = await fetch("http://localhost:5001/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAddress),
          credentials: "include"
        });
        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 409) {
            throw new Error(errorData.error || "地址已经存在");
          }
          throw new Error(errorData.error || "Error adding address");
        }
        toast.success("Address added");
      }
      // Refresh list
      const refreshed = await fetch("http://localhost:5001/api/addresses", {
        credentials: "include"
      }).then((r) => r.json());
      setAddresses(refreshed);
      setIsDialogOpen(false);
      setEditingAddress(null);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5001/api/addresses/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Error deleting address");
      toast.success("Address deleted");
      setAddresses(addresses.filter((a) => a._id !== id));
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set as default
  const handleSetDefault = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5001/api/addresses/${id}/default`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Error setting default address");
      toast.success("Default address updated");
      // Refresh list
      const refreshed = await fetch("http://localhost:5001/api/addresses", {
        credentials: "include"
      }).then((r) => r.json());
      setAddresses(refreshed);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
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
                <Label htmlFor="recipientName">Nom du destinataire *</Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  placeholder="Nom du destinataire"
                  defaultValue={editingAddress?.recipientName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Téléphone"
                  defaultValue={editingAddress?.phone}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLabel">Type d'adresse *</Label>
                <select
                  id="addressLabel"
                  name="addressLabel"
                  defaultValue={editingAddress?.addressLabel || "home"}
                  required
                  className="w-full border rounded px-2 py-2"
                >
                  <option value="home">Domicile</option>
                  <option value="work">Travail</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine">Adresse détaillée *</Label>
                <Input
                  id="addressLine"
                  name="addressLine"
                  placeholder="Numéro et nom de rue"
                  defaultValue={editingAddress?.addressLine}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal *</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="75001"
                    defaultValue={editingAddress?.postalCode}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
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
                <Label htmlFor="province">Province *</Label>
                <Input
                  id="province"
                  name="province"
                  placeholder="Île-de-France"
                  defaultValue={editingAddress?.province}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="France"
                  defaultValue={editingAddress?.country || "France"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isDefault">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    defaultChecked={editingAddress?.isDefault || false}
                    className="mr-2"
                  />
                  Définir comme adresse par défaut
                </Label>
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

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Chargement...</h3>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Erreur</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une adresse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const Icon = getAddressIcon(address.addressLabel);
            return (
              <Card
                key={address._id}
                className={address.isDefault ? "border-primary" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {address.addressLabel}
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
                    {address.addressLine}
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
                          onClick={() => handleSetDefault(address._id)}
                        >
                          Par défaut
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(address._id)}
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
