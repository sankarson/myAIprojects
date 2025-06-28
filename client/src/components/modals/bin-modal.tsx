import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

const formSchema = insertBinSchema.extend({
  palletId: z.number().optional(),
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
      palletId: undefined,
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (bin) {
      form.reset({
        palletId: bin.palletId || undefined,
        imageUrl: bin.imageUrl || "",
      });
    } else {
      form.reset({
        palletId: undefined,
        imageUrl: "",
      });
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
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isEditing && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Bin ID</Label>
                  <Input
                    value={bin?.binNumber || ""}
                    disabled
                    className="bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Auto-generated sequential ID</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="palletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pallet</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pallet (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No pallet assigned</SelectItem>
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

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/bin-image.jpg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">SKUs in this Bin</h4>
                <Button type="button" variant="outline" onClick={addSku}>
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
                <div className="border border-gray-200 rounded-lg">
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
