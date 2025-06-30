import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertBinSchema, type Bin, type InsertBin, type Pallet, type Sku, type BinWithSkus } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { z } from "zod";

const formSchema = insertBinSchema.extend({
  palletId: z.number().optional(),
  name: z.string().min(1, "Name is required"),
});

type FormData = z.infer<typeof formSchema>;

interface BinSku {
  skuId: number;
  quantity: number;
  sku?: Sku;
}

interface BinModalProps {
  isOpen: boolean;
  onClose: () => void;
  bin?: Bin | null;
}

export function BinModal({ isOpen, onClose, bin }: BinModalProps) {
  const { toast } = useToast();
  const isEditing = !!bin;
  const [binSkus, setBinSkus] = useState<BinSku[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      setUploadedImage(result.url);
      form.setValue('imageUrl', result.url);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { data: pallets } = useQuery<Pallet[]>({
    queryKey: ["/api/pallets"],
  });

  const { data: skus } = useQuery<Sku[]>({
    queryKey: ["/api/skus"],
  });

  const { data: binDetails } = useQuery<BinWithSkus>({
    queryKey: ["/api/bins", bin?.id],
    enabled: !!bin?.id,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      palletId: undefined,
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (bin) {
      form.reset({
        name: bin.name || bin.binNumber,
        palletId: bin.palletId || undefined,
        imageUrl: bin.imageUrl || "",
      });
      setUploadedImage(bin.imageUrl || null);
    } else {
      form.reset({
        name: "",
        palletId: undefined,
        imageUrl: "",
      });
      setUploadedImage(null);
    }
  }, [bin, form]);

  useEffect(() => {
    if (binDetails?.binSkus) {
      setBinSkus(
        binDetails.binSkus.map((bs) => ({
          skuId: bs.skuId,
          quantity: bs.quantity,
          sku: bs.sku,
        }))
      );
    } else {
      setBinSkus([]);
    }
  }, [binDetails]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertBin) => {
      const response = await apiRequest("POST", "/api/bins", data);
      return response.json();
    },
    onSuccess: async (newBin) => {
      // Add SKUs to the bin
      for (const binSku of binSkus) {
        if (binSku.quantity > 0) {
          await apiRequest("POST", `/api/bins/${newBin.id}/skus`, {
            skuId: binSku.skuId,
            quantity: binSku.quantity,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/bins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Bin created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bin",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertBin>) => {
      const response = await apiRequest("PUT", `/api/bins/${bin!.id}`, data);
      return response.json();
    },
    onSuccess: async () => {
      try {
        // Update bin SKUs
        const currentSkus = binDetails?.binSkus || [];
        
        // Remove SKUs that are no longer in the list
        for (const currentSku of currentSkus) {
          if (!binSkus.find(bs => bs.skuId === currentSku.skuId)) {
            await apiRequest("DELETE", `/api/bins/${bin!.id}/skus/${currentSku.skuId}`);
          }
        }
        
        // Add or update SKUs
        for (const binSku of binSkus) {
          if (binSku.quantity > 0) {
            const existing = currentSkus.find(cs => cs.skuId === binSku.skuId);
            if (existing) {
              if (existing.quantity !== binSku.quantity) {
                await apiRequest("PUT", `/api/bins/${bin!.id}/skus/${binSku.skuId}`, {
                  quantity: binSku.quantity,
                });
              }
            } else {
              await apiRequest("POST", `/api/bins/${bin!.id}/skus`, {
                skuId: binSku.skuId,
                quantity: binSku.quantity,
              });
            }
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/bins"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bins", bin!.id] });
        toast({
          title: "Success",
          description: "Bin updated successfully",
        });
        onClose();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update bin SKUs",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bin",
        variant: "destructive",
      });
    },
  });

  const addSku = () => {
    const availableSkus = skus?.filter(
      sku => !binSkus.find(bs => bs.skuId === sku.id)
    ) || [];
    
    if (availableSkus.length === 0) {
      toast({
        title: "No SKUs available",
        description: "All SKUs are already added to this bin",
        variant: "destructive",
      });
      return;
    }
    
    setBinSkus([
      ...binSkus,
      {
        skuId: availableSkus[0].id,
        quantity: 1,
        sku: availableSkus[0],
      },
    ]);
  };

  const removeSku = (skuId: number) => {
    setBinSkus(binSkus.filter(bs => bs.skuId !== skuId));
  };

  const updateSkuQuantity = (skuId: number, quantity: number) => {
    setBinSkus(binSkus.map(bs => 
      bs.skuId === skuId ? { ...bs, quantity } : bs
    ));
  };

  const updateSkuSelection = (oldSkuId: number, newSkuId: number) => {
    const newSku = skus?.find(s => s.id === newSkuId);
    setBinSkus(binSkus.map(bs => 
      bs.skuId === oldSkuId 
        ? { ...bs, skuId: newSkuId, sku: newSku }
        : bs
    ));
  };

  const onSubmit = (data: FormData) => {
    const submitData: InsertBin = {
      name: data.name,
      palletId: data.palletId || null,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Bin" : "Create New Bin"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update bin information, pallet assignment, and manage SKU inventory." 
              : "Create a new bin, assign it to a pallet, and add SKUs with quantities."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter bin name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="palletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pallet</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pallet (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No pallet assigned</SelectItem>
                        {pallets?.map((pallet) => (
                          <SelectItem key={pallet.id} value={pallet.id.toString()}>
                            {pallet.palletNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 md:col-span-2">
                <Label>Bin Image</Label>
                
                {uploadedImage ? (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Bin preview"
                      className="w-32 h-32 rounded-md object-cover border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => {
                        setUploadedImage(null);
                        form.setValue('imageUrl', '');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="bin-image-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload bin image
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            PNG, JPG, GIF up to 5MB
                          </span>
                        </label>
                        <input
                          id="bin-image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file);
                            }
                          }}
                          disabled={isUploading}
                        />
                      </div>
                      {isUploading && (
                        <div className="mt-2 text-sm text-blue-600">
                          Uploading...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h4 className="text-md font-medium text-gray-900">SKUs in this Bin</h4>
                <Button type="button" variant="outline" onClick={addSku} className="self-start sm:self-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add SKU
                </Button>
              </div>

              {binSkus.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No SKUs added to this bin yet</p>
                  <p className="text-sm text-gray-400">Click "Add SKU" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Desktop Table View */}
                  <div className="hidden md:block border border-gray-200 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {binSkus.map((binSku, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={binSku.skuId.toString()}
                                onValueChange={(value) => updateSkuSelection(binSku.skuId, parseInt(value))}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {skus
                                    ?.filter(sku => 
                                      sku.id === binSku.skuId || 
                                      !binSkus.find(bs => bs.skuId === sku.id)
                                    )
                                    .map((sku) => (
                                      <SelectItem key={sku.id} value={sku.id.toString()}>
                                        {sku.skuNumber}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {binSku.sku?.name || "Unknown SKU"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={binSku.quantity}
                                onChange={(e) => updateSkuQuantity(binSku.skuId, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSku(binSku.skuId)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {binSkus.map((binSku, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">SKU</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSku(binSku.skuId)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Select
                          value={binSku.skuId.toString()}
                          onValueChange={(value) => updateSkuSelection(binSku.skuId, parseInt(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {skus
                              ?.filter(sku => 
                                sku.id === binSku.skuId || 
                                !binSkus.find(bs => bs.skuId === sku.id)
                              )
                              .map((sku) => (
                                <SelectItem key={sku.id} value={sku.id.toString()}>
                                  {sku.skuNumber}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            {binSku.sku?.name || "Unknown SKU"}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={binSku.quantity}
                            onChange={(e) => updateSkuQuantity(binSku.skuId, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Update Bin" : "Create Bin"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
