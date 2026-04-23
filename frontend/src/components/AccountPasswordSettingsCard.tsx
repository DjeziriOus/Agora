"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";

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

const MIN_PASSWORD_LENGTH = 8;

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

type PasswordErrors = Partial<Record<PasswordField | "form", string>>;

function mapChangePasswordError(error: {
  code?: string;
  message?: string | null;
}): PasswordErrors {
  switch (error.code) {
    case "INVALID_PASSWORD":
      return {
        currentPassword: "Le mot de passe actuel est incorrect.",
      };
    case "PASSWORD_TOO_SHORT":
      return {
        newPassword: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
      };
    case "PASSWORD_TOO_LONG":
      return {
        newPassword: "Le nouveau mot de passe est trop long.",
      };
    case "CREDENTIAL_ACCOUNT_NOT_FOUND":
      return {
        form: "Ce compte n'utilise pas encore de mot de passe.",
      };
    default:
      return {
        form: error.message ?? "Impossible de modifier le mot de passe.",
      };
  }
}

export function AccountPasswordSettingsCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange =
    (field: PasswordField, setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setErrors((current) => ({
        ...current,
        [field]: undefined,
        form: undefined,
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: PasswordErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Le mot de passe actuel est obligatoire.";
    }

    if (!newPassword) {
      nextErrors.newPassword = "Le nouveau mot de passe est obligatoire.";
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword =
        "Le nouveau mot de passe doit être différent de l'ancien.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword =
        "La confirmation du nouveau mot de passe est obligatoire.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword =
        "La confirmation du mot de passe ne correspond pas.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
      } as Parameters<typeof authClient.changePassword>[0]);

      if (error) {
        setErrors(mapChangePasswordError(error));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      toast.success("Mot de passe mis à jour.");
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Impossible de modifier le mot de passe.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sécurité
        </CardTitle>
        <CardDescription>
          Gérez la sécurité de votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {errors.form ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={handleFieldChange(
                "currentPassword",
                setCurrentPassword,
              )}
            />
            {errors.currentPassword ? (
              <p className="text-sm text-destructive">
                {errors.currentPassword}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={handleFieldChange("newPassword", setNewPassword)}
              />
              {errors.newPassword ? (
                <p className="text-sm text-destructive">
                  {errors.newPassword}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={handleFieldChange(
                  "confirmPassword",
                  setConfirmPassword,
                )}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>

          <Button disabled={isSaving} type="submit">
            {isSaving ? "Modification..." : "Changer le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
