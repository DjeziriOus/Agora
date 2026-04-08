"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProduct, useCategories } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Package, Upload, X } from "lucide-react";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(20, "La description doit contenir au moins 20 caractères"),
  price: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0"),
  stock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif"),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

type VariantForm = {
  code: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
  isActive: boolean;
};

const createEmptyVariant = (index: number): VariantForm => ({
  code: `variant-${index + 1}`,
  name: "",
  sku: "",
  price: "",
  stock: 0,
  isActive: true,
});

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    if (!images.length) {
      toast.error("Ajoutez au moins une image pour créer le produit");
      return;
    }

    const normalizedVariants = variants
      .map((variant) => ({
        code: variant.code.trim(),
        name: variant.name.trim(),
        sku: variant.sku.trim(),
        price: variant.price.trim(),
        stock: Number(variant.stock),
        isActive: variant.isActive,
      }))
      .filter((variant) => variant.code.length > 0 || variant.name.length > 0);

    for (const variant of normalizedVariants) {
      if (!variant.code || !variant.name) {
        toast.error("Chaque variant doit avoir un code et un nom");
        return;
      }
      if (!Number.isInteger(variant.stock) || variant.stock < 0) {
        toast.error("Le stock variant doit etre un entier positif");
        return;
      }
      if (variant.price && Number(variant.price) < 0) {
        toast.error("Le prix variant doit etre positif");
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", String(data.price));
    formData.append("stock", String(data.stock));
    formData.append("category", data.category);
    formData.append("isActive", String(data.isActive));
    formData.append(
      "variants",
      JSON.stringify(
        normalizedVariants.map((variant) => ({
          code: variant.code,
          name: variant.name,
          sku: variant.sku,
          price: variant.price ? Number(variant.price) : null,
          stock: variant.stock,
          isActive: variant.isActive,
        })),
      ),
    );

    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      await createProduct.mutateAsync(formData);
      toast.success("Produit créé avec succès");
      router.push("/vendeur/produits");
    } catch {
      toast.error("Erreur lors de la création du produit");
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      toast.error("Vous pouvez ajouter jusqu'à 5 images");
      event.target.value = "";
      return;
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    if (filesToAdd.length < selectedFiles.length) {
      toast.error("Seules les 5 premières images sont conservées");
    }

    setImages((currentImages) => [...currentImages, ...filesToAdd]);
    setImagePreviews((currentPreviews) => [
      ...currentPreviews,
      ...filesToAdd.map((file) => URL.createObjectURL(file)),
    ]);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((currentImages) => currentImages.filter((_, i) => i !== index));
    setImagePreviews((currentPreviews) =>
      currentPreviews.filter((_, i) => i !== index),
    );
  };

  const addVariant = () => {
    setVariants((currentVariants) => [
      ...currentVariants,
      createEmptyVariant(currentVariants.length),
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((currentVariants) =>
      currentVariants.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const updateVariant = <K extends keyof VariantForm>(
    index: number,
    key: K,
    value: VariantForm[K],
  ) => {
    setVariants((currentVariants) =>
      currentVariants.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, [key]: value } : variant,
      ),
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendeur/produits">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Nouveau produit
          </h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau produit à votre boutique
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du produit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Sac en cuir artisanal"
                            {...field}
                          />
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
                            placeholder="Décrivez votre produit en détail..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Une bonne description aide les clients à comprendre
                          votre produit.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    id="product-images"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {imagePreviews.map((imagePreview, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={imagePreview}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < 5 && (
                      <label
                        htmlFor="product-images"
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Ajouter</span>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Ajoutez jusqu'à 5 images JPEG, PNG ou WebP. La première
                    sera l'image principale.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div
                        key={`${variant.code}-${index}`}
                        className="rounded-lg border p-3 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Code (ex: red-m)"
                            value={variant.code}
                            onChange={(event) =>
                              updateVariant(index, "code", event.target.value)
                            }
                          />
                          <Input
                            placeholder="Nom (ex: Rouge - M)"
                            value={variant.name}
                            onChange={(event) =>
                              updateVariant(index, "name", event.target.value)
                            }
                          />
                          <Input
                            placeholder="SKU (optionnel)"
                            value={variant.sku}
                            onChange={(event) =>
                              updateVariant(index, "sku", event.target.value)
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Prix override (optionnel)"
                            value={variant.price}
                            onChange={(event) =>
                              updateVariant(index, "price", event.target.value)
                            }
                          />
                          <Input
                            type="number"
                            min="0"
                            placeholder="Stock variant"
                            value={variant.stock}
                            onChange={(event) =>
                              updateVariant(
                                index,
                                "stock",
                                Number.parseInt(event.target.value || "0", 10),
                              )
                            }
                          />
                          <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <span className="text-sm text-muted-foreground">Actif</span>
                            <Switch
                              checked={variant.isActive}
                              onCheckedChange={(value) =>
                                updateVariant(index, "isActive", value)
                              }
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeVariant(index)}
                          >
                            Supprimer variant
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={addVariant}>
                    Ajouter un variant
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Tarification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Stock */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité en stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Organisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Liste fixe pour la premiere version. La categorie sera
                          ensuite envoyee comme simple texte au backend.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Actif</FormLabel>
                          <FormDescription className="text-xs">
                            Rendre ce produit visible
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/vendeur/produits">Annuler</Link>
            </Button>
            <Button type="submit" disabled={createProduct.isPending}>
              {createProduct.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Créer le produit
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
