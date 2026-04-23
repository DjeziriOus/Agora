"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Plus, Edit, Trash, Home, Building } from "lucide-react";
import { toast } from "sonner";

import { addressesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Address {
  _id: string;
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

type AddressPayload = Omit<Address, "_id" | "isDefault">;

const addressLabelMap: Record<Address["addressLabel"], string> = {
  home: "Domicile",
  work: "Travail",
  other: "Autre",
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function AddressesContent() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = (await addressesApi.getAll()) as Address[];
      setAddresses(data);
    } catch (error) {
      setError(getErrorMessage(error, "Erreur lors du chargement des adresses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const shouldSetAsDefault =
      formData.get("isDefault") === "on" || addresses.length === 0;
    const addressPayload: AddressPayload = {
      recipientName: formData.get("recipientName") as string,
      phone: formData.get("phone") as string,
      addressLabel: formData.get("addressLabel") as Address["addressLabel"],
      addressLine: formData.get("addressLine") as string,
      city: formData.get("city") as string,
      province: formData.get("province") as string,
      postalCode: formData.get("postalCode") as string,
      country: formData.get("country") as string,
    };

    try {
      setLoading(true);
      setError(null);

      const savedAddress = editingAddress
        ? ((await addressesApi.update(
            editingAddress._id,
            addressPayload,
          )) as Address)
        : ((await addressesApi.create(addressPayload)) as Address);

      if (shouldSetAsDefault) {
        await addressesApi.setDefault(savedAddress._id);
      }

      toast.success(
        editingAddress ? "Adresse modifiée" : "Adresse ajoutée",
      );
      await loadAddresses();
      setIsDialogOpen(false);
      setEditingAddress(null);
    } catch (error) {
      const message = getErrorMessage(
        error,
        editingAddress
          ? "Erreur lors de la modification de l'adresse."
          : "Erreur lors de l'ajout de l'adresse.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await addressesApi.delete(id);
      toast.success("Adresse supprimée");
      await loadAddresses();
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Erreur lors de la suppression de l'adresse.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await addressesApi.setDefault(id);
      toast.success("Adresse par défaut modifiée");
      await loadAddresses();
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Erreur lors de la définition de l'adresse par défaut.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getAddressIcon = (addressLabel: Address["addressLabel"]) => {
    switch (addressLabel) {
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
        addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Aucune adresse enregistrée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez votre première adresse de livraison pour commencer.
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
                        {addressLabelMap[address.addressLabel]}
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
        )
      )}
    </div>
  );
}

export default function AddressesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  return (
    <>
      {/* If navigated from checkout, show return button */}
      {from === 'checkout' && (
        <div style={{ margin: '16px 0' }}>
          {/* Affiche un bouton pour retourner au paiement */}
          <button
            className="px-4 py-2 bg-[var(--agora-primary)] text-white rounded"
            onClick={() => router.push('/checkout')}
          >
            Retour au paiement
          </button>
        </div>
      )}
      <Suspense fallback={<div>Chargement...</div>}>
        <AddressesContent />
      </Suspense>
    </>
  );
}
