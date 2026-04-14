"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useSellerProduct,
  useUpdateProduct,
  useCategories,
} from "@/hooks/useApi";
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
import { ArrowLeft, Save, Upload, X, Plus, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import type { ProductImage } from "@/types";

const productSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(20, "La description doit contenir au moins 20 caractères")
    .max(1000, "La description ne peut pas dépasser 1000 caractères"),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

type VariantForm = {
  id?: string; // existing variant document _id for upsert
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

const normalizeCategory = (value = "") =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const { data: product, isLoading: isProductLoading } =
    useSellerProduct(productId);
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  const isLoading = isProductLoading || isCategoriesLoading;
  const updateProduct = useUpdateProduct();

  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const newImagePreviewsRef = useRef<string[]>([]);

  // Seamless Toggle
  const [hasMultipleOptions, setHasMultipleOptions] = useState(false);
  const [globalPrice, setGlobalPrice] = useState("");
  const [globalStock, setGlobalStock] = useState("0");
  // Ghost Memory: variant data persists when toggling
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const matchedCategoryName =
    product && categories
      ? categories.find(
          (cat) =>
            normalizeCategory(cat.name) === normalizeCategory(product.category),
        )?.name || product.category
      : "";
  console.log(matchedCategoryName);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      isActive: true,
    },
    values: product
      ? {
          name: product.name,
          description: product.description,
          category: matchedCategoryName,
          isActive: product.isActive,
        }
      : undefined,
  });
  useEffect(() => {
    newImagePreviewsRef.current = newImagePreviews;
  }, [newImagePreviews]);

  // ── Hydration: populate form from loaded product ──────────────────────────
  useEffect(() => {
    if (!product) return;

    setExistingImages(product.images || []);
    setNewImages([]);
    newImagePreviewsRef.current.forEach((p) => URL.revokeObjectURL(p));
    newImagePreviewsRef.current = [];
    setNewImagePreviews([]);

    // Hydrate variants and detect simple vs multi mode
    const loadedVariants = (product.variants ?? []).map((v) => ({
      id: v.id,
      code: v.code ?? "",
      name: v.name ?? "",
      sku: v.sku ?? "",
      price: String(v.price ?? 0),
      stock: v.stock ?? 0,
      isActive: v.isActive ?? true,
    }));

    const isSimple =
      loadedVariants.length <= 1 &&
      (loadedVariants.length === 0 ||
        loadedVariants[0].code === "default" ||
        loadedVariants[0].name === "Standard");

    setHasMultipleOptions(!isSimple);

    if (isSimple && loadedVariants.length === 1) {
      setGlobalPrice(loadedVariants[0].price);
      setGlobalStock(String(loadedVariants[0].stock));
    }

    setVariants(
      loadedVariants.length > 0 ? loadedVariants : [createEmptyVariant(0)],
    );
  }, [product, form]);

  useEffect(
    () => () => {
      newImagePreviewsRef.current.forEach((preview) =>
        URL.revokeObjectURL(preview),
      );
    },
    [],
  );

  const onSubmit = async (data: ProductFormData) => {
    try {
      const totalImages = existingImages.length + newImages.length;
      if (totalImages === 0) {
        toast.error("Le produit doit garder au moins une image");
        return;
      }

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("isActive", String(data.isActive));

      if (hasMultipleOptions) {
        // Multi-variant mode
        const normalizedVariants = variants
          .map((v) => ({
            id: v.id, // preserve for upsert
            code: v.code.trim(),
            name: v.name.trim(),
            sku: v.sku.trim(),
            price: Number(v.price),
            stock: Number(v.stock),
            isActive: v.isActive,
          }))
          .filter((v) => v.code.length > 0 || v.name.length > 0);

        if (normalizedVariants.length === 0) {
          toast.error("Ajoutez au moins un variant");
          return;
        }

        for (const v of normalizedVariants) {
          if (!v.code || !v.name) {
            toast.error("Chaque variant doit avoir un code et un nom");
            return;
          }
          if (!Number.isFinite(v.price) || v.price < 0) {
            toast.error("Chaque variant doit avoir un prix valide");
            return;
          }
        }

        formData.append("variants", JSON.stringify(normalizedVariants));
      } else {
        // Simple mode: send as default variant
        const price = Number(globalPrice);
        const stock = Number(globalStock);

        if (!Number.isFinite(price) || price <= 0) {
          toast.error("Le prix doit être supérieur à 0");
          return;
        }

        // Preserve the existing default variant ID if it exists
        const existingDefaultId = variants.find(
          (v) => v.code === "default" || v.name === "Standard",
        )?.id;

        const defaultVariant = {
          ...(existingDefaultId ? { id: existingDefaultId } : {}),
          code: "default",
          name: "Standard",
          sku: "",
          price,
          stock: Number.isInteger(stock) ? stock : 0,
          isActive: true,
        };

        formData.append("variants", JSON.stringify([defaultVariant]));
      }

      formData.append(
        "keepImages",
        JSON.stringify(
          existingImages
            .map((image) => image.publicId)
            .filter((publicId) => publicId),
        ),
      );

      newImages.forEach((image) => {
        formData.append("images", image);
      });

      await updateProduct.mutateAsync({
        id: productId,
        data: formData,
      });
      toast.success("Produit mis à jour");
      router.push("/vendeur/produits");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const processFiles = (files: File[]) => {
    const totalImages = existingImages.length + newImages.length;
    const remainingSlots = 5 - totalImages;
    if (remainingSlots <= 0) {
      toast.error("Vous pouvez ajouter jusqu'à 5 images");
      return;
    }
    const filesToAdd = files.slice(0, remainingSlots);
    setNewImages((prev) => [...prev, ...filesToAdd]);
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    processFiles(selectedFiles);
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!droppedFiles.length) return;

    processFiles(droppedFiles);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: keyof VariantForm,
    value: string | number | boolean,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant(prev.length)]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[200px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Produit non trouvé</p>
        <Button asChild className="mt-4">
          <Link href="/vendeur/produits">Retour aux produits</Link>
        </Button>
      </div>
    );
  }

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendeur/produits">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Modifier le produitt
          </h1>
          <p className="text-muted-foreground mt-1">{product.name}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* General Info */}
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
                            placeholder="ex: T-shirt en coton bio"
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
                            className="min-h-[120px]"
                            maxLength={1000}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between">
                          <FormMessage />
                          <span
                            className={`text-xs tabular-nums ${
                              (field.value?.length ?? 0) > 950
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {field.value?.length ?? 0}/1000
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images ({totalImages}/5)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Existing images */}
                    {existingImages.map((image, index) => (
                      <div
                        key={`existing-${image.publicId}`}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                      >
                        <img
                          src={image.url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {/* New image previews */}
                    {newImagePreviews.map((preview, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                      >
                        <img
                          src={preview}
                          alt={`Nouveau ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {totalImages < 5 && (
                      <label
                        className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                          isDragging
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-primary"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Ajouter</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Variants Toggle + Section ── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Options du produit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-sm">
                        Ce produit a plusieurs options
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tailles, couleurs, matériaux, etc.
                      </p>
                    </div>
                    <Switch
                      checked={hasMultipleOptions}
                      onCheckedChange={setHasMultipleOptions}
                    />
                  </div>

                  {/* Multi-variant mode */}
                  {hasMultipleOptions && (
                    <div className="space-y-4">
                      {variants.map((variant, index) => (
                        <div
                          key={variant.id ?? index}
                          className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">
                              Variant #{index + 1}
                              {variant.id && (
                                <span className="text-xs font-normal text-muted-foreground ml-2">
                                  (existant)
                                </span>
                              )}
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVariant(index)}
                              disabled={variants.length <= 1}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Code
                              </label>
                              <Input
                                placeholder="ex: red-m"
                                value={variant.code}
                                onChange={(e) =>
                                  updateVariant(index, "code", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Nom
                              </label>
                              <Input
                                placeholder="ex: Rouge - M"
                                value={variant.name}
                                onChange={(e) =>
                                  updateVariant(index, "name", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                SKU
                              </label>
                              <Input
                                placeholder="optionnel"
                                value={variant.sku}
                                onChange={(e) =>
                                  updateVariant(index, "sku", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Prix (€)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={variant.price}
                                onChange={(e) =>
                                  updateVariant(index, "price", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Stock
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={variant.stock}
                                onChange={(e) =>
                                  updateVariant(
                                    index,
                                    "stock",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-end gap-2 pb-1">
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Actif
                              </label>
                              <Switch
                                checked={variant.isActive}
                                onCheckedChange={(checked) =>
                                  updateVariant(index, "isActive", checked)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addVariant}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un variant
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column – Sidebar */}
            <div className="space-y-6">
              {/* Category & Status */}
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
                          key={field.value || "empty"}
                          onValueChange={field.onChange}
                          // defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(categories ?? []).map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <FormLabel className="text-sm">
                            Publier le produit
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Rendre visible dans votre boutique
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

              {/* Simple product mode: Global Price & Stock */}
              {!hasMultipleOptions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tarification & Stock</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Prix (€)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={globalPrice}
                        onChange={(e) => setGlobalPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Stock
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={globalStock}
                        onChange={(e) => setGlobalStock(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={updateProduct.isPending}
              >
                {updateProduct.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
