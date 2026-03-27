"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useProduct,
  useUpdateProduct,
  useUpdateProductStock,
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
import { ArrowLeft, Save, Upload, X, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(20, "La description doit contenir au moins 20 caractères"),
  price: z.coerce.number().min(0.01, "Le prix doit être supérieur à 0"),
  categoryId: z.string().min(1, "Veuillez sélectionner une catégorie"),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const { data: product, isLoading } = useProduct(productId);
  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct();
  const updateStock = useUpdateProductStock();

  const [images, setImages] = useState<string[]>([]);
  const [stockAdjustment, setStockAdjustment] = useState(0);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        isActive: product.isActive,
      });
      setImages(product.images || []);
    }
  }, [product, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct.mutateAsync({
        id: productId,
        data: {
          ...data,
          images,
        },
      });
      toast.success("Produit mis à jour");
      router.push("/vendeur/produits");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleStockUpdate = async () => {
    if (stockAdjustment === 0 || !product) return;
    const newStock = product.stock + stockAdjustment;
    if (newStock < 0) {
      toast.error("Le stock ne peut pas être négatif");
      return;
    }
    try {
      await updateStock.mutateAsync({ id: productId, stock: newStock });
      toast.success("Stock mis à jour");
      setStockAdjustment(0);
    } catch {
      toast.error("Erreur lors de la mise à jour du stock");
    }
  };

  const handleImageUpload = () => {
    const placeholderImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
    ];
    const randomImage =
      placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    setImages([...images, randomImage]);
    toast.success("Image ajoutée");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px]" />
          </div>
          <div>
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-heading font-semibold mb-2">
          Produit introuvable
        </h2>
        <Button asChild variant="outline">
          <Link href="/vendeur/produits">Retour aux produits</Link>
        </Button>
      </div>
    );
  }

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
            Modifier le produit
          </h1>
          <p className="text-muted-foreground mt-1">{product.name}</p>
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
                          <Input {...field} />
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
                          <Textarea className="min-h-[150px]" {...field} />
                        </FormControl>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={image}
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
                    {images.length < 5 && (
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Ajouter</span>
                      </button>
                    )}
                  </div>
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
                          <Input type="number" step="0.01" min="0" {...field} />
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
                  <CardTitle>Gestion du stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Stock actuel
                    </p>
                    <p className="text-2xl font-bold">{product.stock}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ajuster le stock</p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setStockAdjustment(stockAdjustment - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={stockAdjustment}
                        onChange={(e) =>
                          setStockAdjustment(parseInt(e.target.value) || 0)
                        }
                        className="w-20 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setStockAdjustment(stockAdjustment + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {stockAdjustment !== 0 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                          Nouveau stock: {product.stock + stockAdjustment}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleStockUpdate}
                          disabled={updateStock.isPending}
                        >
                          Appliquer
                        </Button>
                      </div>
                    )}
                  </div>
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
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
