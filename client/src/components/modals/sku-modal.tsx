import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertSkuSchema, type Sku, type InsertSku } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type SkuFormData = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
};

interface SkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku?: Sku | null;
}

export function SkuModal({ isOpen, onClose, sku }: SkuModalProps) {
  const { toast } = useToast();
  const isEditing = !!sku;

  const form = useForm<SkuFormData>({
    defaultValues: {
      name: "",
      description: "",
      price: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (sku) {
      form.reset({
        name: sku.name,
        description: sku.description || "",
        price: sku.price ? sku.price.toString() : "",
        imageUrl: sku.imageUrl || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
      });
    }
  }, [sku, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSku) => {
      const response = await apiRequest("POST", "/api/skus", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "SKU created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create SKU",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertSku>) => {
      const response = await apiRequest("PUT", `/api/skus/${sku!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      toast({
        title: "Success",
        description: "SKU updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update SKU",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SkuFormData) => {
    const submitData: InsertSku = {
      name: data.name,
      description: data.description || null,
      price: data.price ? data.price.toString() : null,
      imageUrl: data.imageUrl || null,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit SKU" : "Add New SKU"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the SKU details including name, description, price, and image." 
              : "Create a new SKU with product information and optional pricing."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isEditing && (
              <div>
                <Label className="text-sm font-medium text-gray-700">SKU ID</Label>
                <Input
                  value={sku?.skuNumber || ""}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">Auto-generated sequential ID</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
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
                    <Textarea 
                      rows={3} 
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/image.jpg"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Update SKU" : "Create SKU"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
