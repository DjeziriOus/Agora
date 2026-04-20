"use client";

import { useEffect, useState, type FormEvent } from "react";
import { User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountProfileSettingsCard() {
  const { user, refreshSession } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
  }, [user?.firstName, user?.lastName]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error("Impossible de charger votre profil.");
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      toast.error("Le prénom et le nom sont obligatoires.");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await authClient.updateUser({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
      } as Parameters<typeof authClient.updateUser>[0]);

      if (error) {
        throw new Error(
          error.message ?? "Erreur lors de la mise à jour du profil.",
        );
      }

      await refreshSession();
      toast.success("Profil mis à jour");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour du profil.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations personnelles
        </CardTitle>
        <CardDescription>
          Mettez à jour vos informations de profil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={user?.email ?? ""}
              readOnly
              className="bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">
              L&apos;adresse e-mail n&apos;est pas modifiable dans cette étape.
            </p>
          </div>

          <Button disabled={isSaving || !user} type="submit">
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
