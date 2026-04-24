"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Camera, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function AccountProfilePictureCard() {
  const { user, refreshSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateFile = useCallback((file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(
        "Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.",
      );
      return false;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 5 Mo.");
      return false;
    }
    return true;
  }, []);

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    },
    [validateFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelect],
  );

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const res = await fetch(`${API_URL}/api/account/profile-picture`, {
        method: "PUT",
        credentials: "include",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || "Erreur lors de la mise à jour de la photo.",
        );
      }

      await refreshSession();
      setSelectedFile(null);
      setPreview(null);
      toast.success("Photo de profil mise à jour !");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour de la photo.",
      );
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, refreshSession]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/account/profile-picture`, {
        method: "DELETE",
        credentials: "include",
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || "Erreur lors de la suppression de la photo.",
        );
      }

      await refreshSession();
      setSelectedFile(null);
      setPreview(null);
      toast.success("Photo de profil supprimée.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression de la photo.",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [refreshSession]);

  // ── Cancel preview ────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [preview]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "";
  const displayImage = preview || user?.image || null;
  const hasExistingAvatar = Boolean(user?.image);
  const isBusy = isUploading || isDeleting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photo de profil
        </CardTitle>
        <CardDescription>
          Personnalisez votre avatar. JPEG, PNG ou WebP, 5 Mo max.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar preview / drop zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isBusy && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!isBusy) fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative group cursor-pointer shrink-0
              w-28 h-28 rounded-full overflow-hidden
              border-2 border-dashed transition-all duration-200
              ${isDragging
                ? "border-primary bg-primary/5 scale-105"
                : "border-border hover:border-primary/50"
              }
              ${isBusy ? "pointer-events-none opacity-60" : ""}
            `}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt="Photo de profil"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {initials}
                </span>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-6 h-6 text-white" />
            </div>

            {/* Loading spinner overlay */}
            {isBusy && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
            id="avatar-file-input"
          />

          {/* Actions */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {selectedFile ? (
              <>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={isBusy}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi…
                      </>
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isBusy}
                  >
                    Annuler
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choisir une photo
                </Button>
                {hasExistingAvatar && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={isBusy}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Suppression…
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer la photo
                      </>
                    )}
                  </Button>
                )}
              </>
            )}

            <p className="text-xs text-muted-foreground">
              Cliquez ou glissez-déposez une image
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
