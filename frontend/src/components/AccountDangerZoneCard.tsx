"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config";
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteAccountError = {
  code?: string;
  message?: string | null;
};

function mapDeleteAccountError(error: DeleteAccountError) {
  switch (error.code) {
    case "INVALID_PASSWORD":
      return "Le mot de passe actuel est incorrect.";
    case "CREDENTIAL_ACCOUNT_NOT_FOUND":
      return "Ce compte n'utilise pas encore de mot de passe. Définissez-en un avant de pouvoir supprimer le compte.";
    case "PENDING_CLIENT_ORDERS":
    case "PENDING_SELLER_ORDERS":
      return (
        error.message ??
        "Vous devez attendre la fin des commandes en cours avant de supprimer le compte."
      );
    case "SESSION_EXPIRED":
      return "Votre session n'est plus assez récente. Réessayez après vous être reconnecté.";
    default:
      return error.message ?? "Impossible de supprimer le compte.";
  }
}

export function AccountDangerZoneCard() {
  const { logout, refreshSession, isSeller } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCheckingDeletion, setIsCheckingDeletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetDeleteFlow = () => {
    setPassword("");
    setDeleteError(null);
    setIsCredentialsDialogOpen(false);
    setIsConfirmDialogOpen(false);
    setIsCheckingDeletion(false);
    setIsDeleting(false);
  };

  const handleCredentialsDialogChange = (open: boolean) => {
    if (isCheckingDeletion || isDeleting) {
      return;
    }

    setIsCredentialsDialogOpen(open);

    if (!open) {
      setPassword("");
      setDeleteError(null);
    }
  };

  const handleConfirmDialogChange = (open: boolean) => {
    if (isCheckingDeletion || isDeleting) {
      return;
    }

    setIsConfirmDialogOpen(open);

    if (!open) {
      setPassword("");
      setDeleteError(null);
    }
  };

  const handleContinueToConfirmation = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!password) {
      setDeleteError("Le mot de passe actuel est obligatoire pour continuer.");
      return;
    }

    setDeleteError(null);
    setIsCheckingDeletion(true);

    try {
      const response = await fetch(`${API_URL}/api/account/delete-check`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = (await response.json()) as DeleteAccountError;
        setDeleteError(mapDeleteAccountError(error));
        return;
      }

      setIsCredentialsDialogOpen(false);
      setIsConfirmDialogOpen(true);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Impossible de vérifier la suppression du compte.",
      );
    } finally {
      setIsCheckingDeletion(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      setDeleteError("Le mot de passe actuel est obligatoire pour continuer.");
      setIsConfirmDialogOpen(false);
      setIsCredentialsDialogOpen(true);
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      const { error } = await authClient.deleteUser({
        password,
        callbackURL: "/login",
      } as Parameters<typeof authClient.deleteUser>[0]);

      if (error) {
        setDeleteError(mapDeleteAccountError(error));
        setIsConfirmDialogOpen(false);
        setIsCredentialsDialogOpen(true);
        return;
      }

      await refreshSession();
      toast.success("Compte supprimé.");
      resetDeleteFlow();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le compte.",
      );
      setIsConfirmDialogOpen(false);
      setIsCredentialsDialogOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSummary = isSeller
    ? "Supprimer votre compte, retirer votre boutique de la plateforme et masquer vos produits."
    : "Supprimer votre compte et effacer vos informations personnelles enregistrées.";

  const deleteDetails = isSeller
    ? "Votre compte sera supprimé. Votre boutique et vos produits seront retirés de la plateforme. Votre panier, vos adresses et les informations personnelles associées seront effacés. Certaines données liées aux commandes peuvent être conservées pour l'historique des transactions."
    : "Votre compte sera supprimé. Votre panier, vos adresses et les informations personnelles associées seront effacés. Certaines données liées aux commandes peuvent être conservées pour l'historique des transactions.";

  const confirmDetails = isSeller
    ? "Cette action supprimera définitivement votre accès au compte vendeur et retirera votre boutique de la plateforme."
    : "Cette action supprimera définitivement votre accès au compte.";

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="max-w-md">
              <p className="font-medium text-destructive">Supprimer le compte</p>
              <p className="text-sm text-muted-foreground">{deleteSummary}</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteError(null);
                setPassword("");
                setIsCredentialsDialogOpen(true);
              }}
            >
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isCredentialsDialogOpen}
        onOpenChange={handleCredentialsDialogChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le compte ?</DialogTitle>
            <DialogDescription>{deleteDetails} </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleContinueToConfirmation}>
            

            {deleteError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {deleteError}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="delete-account-password">
                Mot de passe actuel
              </Label>
              <Input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setDeleteError(null);
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isCheckingDeletion}
                onClick={() => handleCredentialsDialogChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isCheckingDeletion}
              >
                {isCheckingDeletion ? "Vérification..." : "Continuer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              Confirmation finale
            </DialogTitle>
            <DialogDescription>{confirmDetails} Cette action est irréversible.</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => {
                setIsConfirmDialogOpen(false);
                setIsCredentialsDialogOpen(true);
              }}
            >
              Retour
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
