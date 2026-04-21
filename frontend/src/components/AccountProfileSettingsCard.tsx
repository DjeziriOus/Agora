"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
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
  const {
    user,
    refreshSession,
    requireEmailVerification,
    isAuthConfigLoading,
  } = useAuth();
  const pathname = usePathname();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPendingEmailChange(null);
      return;
    }

    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");

    if (
      pendingEmailChange &&
      pendingEmailChange.trim().toLowerCase() === user.email.trim().toLowerCase()
    ) {
      setPendingEmailChange(null);
      setEmail(user.email);
      toast.success("Adresse e-mail mise à jour.");
      return;
    }

    if (!pendingEmailChange) {
      setEmail(user.email ?? "");
    }
  }, [pendingEmailChange, user?.email, user?.firstName, user?.lastName]);

  const clearPendingEmailChangeState = () => {
    setPendingEmailChange(null);
  };

  const persistPendingEmailChangeState = (nextEmail: string) => {
    setPendingEmailChange(nextEmail);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error("Impossible de charger votre profil.");
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const currentEmail = user.email.trim().toLowerCase();
    const hasProfileChanges =
      trimmedFirstName !== (user.firstName ?? "").trim() ||
      trimmedLastName !== (user.lastName ?? "").trim();
    const hasEmailChange = trimmedEmail !== currentEmail;

    if (!trimmedFirstName || !trimmedLastName) {
      toast.error("Le prénom et le nom sont obligatoires.");
      return;
    }

    if (!trimmedEmail) {
      toast.error("L'adresse e-mail est obligatoire.");
      return;
    }

    if (!hasProfileChanges && !hasEmailChange) {
      toast.error("Aucune modification à enregistrer.");
      return;
    }

    setIsSaving(true);

    try {
      let profileUpdated = false;
      let emailUpdatedDirectly = false;
      let emailVerificationSent = false;

      if (hasProfileChanges) {
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

        profileUpdated = true;
      }

      if (hasEmailChange) {
        const { error } = await authClient.changeEmail({
          newEmail: trimmedEmail,
          callbackURL: pathname,
        } as Parameters<typeof authClient.changeEmail>[0]);

        if (error) {
          throw new Error(
            error.message ?? "Erreur lors du changement d'adresse e-mail.",
          );
        }

        const { data: sessionData } = await authClient.getSession();
        const updatedSessionEmail =
          typeof sessionData?.user?.email === "string"
            ? sessionData.user.email.trim().toLowerCase()
            : currentEmail;

        if (updatedSessionEmail === trimmedEmail) {
          clearPendingEmailChangeState();
          setEmail(trimmedEmail);
          emailUpdatedDirectly = true;
        } else {
          persistPendingEmailChangeState(trimmedEmail);
          setEmail(trimmedEmail);
          emailVerificationSent = true;
        }
      }

      if (profileUpdated || emailUpdatedDirectly) {
        await refreshSession();
      }

      if (emailVerificationSent && profileUpdated) {
        toast.success(
          "Profil mis à jour. Un e-mail de vérification a été envoyé à la nouvelle adresse.",
        );
      } else if (emailVerificationSent) {
        toast.success(
          "Un e-mail de vérification a été envoyé à la nouvelle adresse.",
        );
      } else if (emailUpdatedDirectly && profileUpdated) {
        toast.success("Profil et adresse e-mail mis à jour.");
      } else if (emailUpdatedDirectly) {
        toast.success("Adresse e-mail mise à jour.");
      } else if (profileUpdated) {
        toast.success("Profil mis à jour.");
      }
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {pendingEmailChange &&
            pendingEmailChange !== user?.email?.trim().toLowerCase() ? (
              <p className="text-xs text-muted-foreground">
                Un e-mail de vérification a été envoyé à{" "}
                <span className="font-medium text-foreground">
                  {pendingEmailChange}
                </span>
                . L&apos;adresse sera mise à jour après validation du lien
                reçu.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {!isAuthConfigLoading && requireEmailVerification
                  ? "Un lien de validation sera envoyé à la nouvelle adresse e-mail."
                  : "La nouvelle adresse sera appliquée directement quand c'est possible."}
              </p>
            )}
          </div>

          <Button disabled={isSaving || !user} type="submit">
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
