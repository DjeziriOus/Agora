"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyStore, useUpdateStore, useCreateStore } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Store, Save, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const storeSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères"),
  logo: z.string().optional(),
  banner: z.string().optional(),
});

type StoreFormData = z.infer<typeof storeSchema>;

export default function VendorStorePage() {
  const { data: store, isLoading, error } = useMyStore();
  const updateStore = useUpdateStore();
  const createStore = useCreateStore();

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      description: "",
      logo: "",
      banner: "",
    },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        name: store.name,
        description: store.description || "",
        logo: store.logo || "",
        banner: store.banner || "",
      });
    }
  }, [store, form]);

  const onSubmit = async (data: StoreFormData) => {
    try {
      if (store) {
        await updateStore.mutateAsync(data);
        toast.success("Boutique mise à jour");
      } else {
        await createStore.mutateAsync(data);
        toast.success("Boutique créée");
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const hasStore = !!store && !error;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Ma boutique
          </h1>
          <p className="text-muted-foreground mt-1">
            {hasStore
              ? "Gérez les informations de votre boutique"
              : "Créez votre boutique pour commencer à vendre"}
          </p>
        </div>
        {hasStore && (
          <Button variant="outline" asChild>
            <Link href={`/boutique/${store.id}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir ma boutique
            </Link>
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Informations de la boutique
              </CardTitle>
              <CardDescription>
                Ces informations seront visibles par vos clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la boutique</FormLabel>
                    <FormControl>
                      <Input placeholder="Ma Super Boutique" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre boutique et ce que vous vendez..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Une bonne description aide les clients à découvrir votre
                      boutique.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Visual Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Identité visuelle</CardTitle>
              <CardDescription>
                Logo et bannière de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted overflow-hidden">
                        {field.value ? (
                          <img
                            src={field.value}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="URL du logo"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Format recommandé: 200x200px, PNG ou JPG
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banner */}
              <FormField
                control={form.control}
                name="banner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bannière</FormLabel>
                    <div className="space-y-3">
                      <div className="w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted overflow-hidden">
                        {field.value ? (
                          <img
                            src={field.value}
                            alt="Bannière"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Aucune bannière
                            </p>
                          </div>
                        )}
                      </div>
                      <FormControl>
                        <Input
                          placeholder="URL de la bannière"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Format recommandé: 1200x300px, PNG ou JPG
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Stats (only if store exists) */}
          {hasStore && (
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{store.productCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Produits</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{store.rating?.toFixed(1) || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">Note moyenne</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{store.reviewCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Avis</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{store.followerCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Abonnés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateStore.isPending || createStore.isPending}
            >
              {updateStore.isPending || createStore.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasStore ? "Enregistrer" : "Créer ma boutique"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
