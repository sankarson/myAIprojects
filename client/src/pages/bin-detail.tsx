import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Package, MapPin, Edit, Trash2, Check, X, Plus } from "lucide-react";
import { type BinWithSkus, type Sku, insertBinSkuSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const addSkuFormSchema = z.object({
  skuId: z.number().min(1, "Please select an SKU"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

type AddSkuFormData = z.infer<typeof addSkuFormSchema>;

export default function BinDetail() {
  const [location, setLocation] = useLocation();
  const binId = new URLSearchParams(window.location.search).get('id');
  const { toast } = useToast();
  
  // State for editing quantities
  const [editingSkuId, setEditingSkuId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");
  
  // State for Add SKU dialog
  const [isAddSkuDialogOpen, setIsAddSkuDialogOpen] = useState(false);
  
  // State for fullscreen image modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // State for SKU image modal
  const [isSkuImageModalOpen, setIsSkuImageModalOpen] = useState(false);
  const [selectedSkuImage, setSelectedSkuImage] = useState<{ url: string; name: string } | null>(null);

  const { data: bin, isLoading } = useQuery<BinWithSkus>({
    queryKey: [`/api/bins/${binId}`],
    enabled: !!binId,
  });

  const { data: skus } = useQuery<Sku[]>({
    queryKey: ["/api/skus"],
  });

  // Form for adding SKUs
  const addSkuForm = useForm<AddSkuFormData>({
    resolver: zodResolver(addSkuFormSchema),
    defaultValues: {
      skuId: 0,
      quantity: 1,
    },
  });

  // Mutation for updating bin-sku quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ binId, skuId, quantity }: { binId: number; skuId: number; quantity: number }) => {
      await apiRequest("PUT", `/api/bins/${binId}/skus/${skuId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bins/${binId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "Quantity updated successfully",
      });
      setEditingSkuId(null);
      setEditQuantity("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing SKU from bin
  const removeSkuMutation = useMutation({
    mutationFn: async ({ binId, skuId }: { binId: number; skuId: number }) => {
      await apiRequest("DELETE", `/api/bins/${binId}/skus/${skuId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bins/${binId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "SKU removed from bin successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove SKU from bin",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding SKU to bin
  const addSkuToBinMutation = useMutation({
    mutationFn: async ({ binId, skuId, quantity }: { binId: number; skuId: number; quantity: number }) => {
      await apiRequest("POST", `/api/bins/${binId}/skus`, { skuId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bins/${binId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "SKU added to bin successfully",
      });
      setIsAddSkuDialogOpen(false);
      addSkuForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add SKU to bin",
        variant: "destructive",
      });
    },
  });

  const handleEditQuantity = (skuId: number, currentQuantity: number) => {
    setEditingSkuId(skuId);
    setEditQuantity(currentQuantity.toString());
  };

  const handleSaveQuantity = (binId: number, skuId: number) => {
    const quantity = parseInt(editQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be a positive number",
        variant: "destructive",
      });
      return;
    }
    updateQuantityMutation.mutate({ binId, skuId, quantity });
  };

  const handleCancelEdit = () => {
    setEditingSkuId(null);
    setEditQuantity("");
  };

  const handleRemoveSku = (binId: number, skuId: number, skuName: string) => {
    if (confirm(`Are you sure you want to remove "${skuName}" from this bin?`)) {
      removeSkuMutation.mutate({ binId, skuId });
    }
  };

  const handleAddSku = (data: AddSkuFormData) => {
    if (!binId) return;
    addSkuToBinMutation.mutate({
      binId: parseInt(binId),
      skuId: data.skuId,
      quantity: data.quantity,
    });
  };

  const handleCloseAddSkuDialog = () => {
    setIsAddSkuDialogOpen(false);
    addSkuForm.reset();
  };

  const handleSkuImageClick = (imageUrl: string, skuName: string) => {
    setSelectedSkuImage({ url: imageUrl, name: skuName });
    setIsSkuImageModalOpen(true);
  };

  // Show all SKUs in the dropdown since adding existing SKUs will now add to quantity
  const availableSkus = skus || [];



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bin Not Found</h1>
          <p className="text-gray-500">The requested bin could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Bin Image Icon */}
              <div 
                className={`w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-4 ${
                  bin.imageUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                }`}
                onClick={() => bin.imageUrl && setIsImageModalOpen(true)}
              >
                {bin.imageUrl ? (
                  <img
                    src={bin.imageUrl}
                    alt={bin.name || bin.binNumber}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bin.name || bin.binNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  {bin.binNumber} • {bin.binSkus?.length || 0} SKUs
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {bin.pallet && (
                <Badge variant="outline" className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {bin.pallet.name || bin.pallet.palletNumber}
                </Badge>
              )}
              <Button
                onClick={() => setIsAddSkuDialogOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add SKU
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl">
          {/* SKUs List */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Package className="h-4 w-4 mr-2" />
                  SKUs in this Bin ({bin.binSkus?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {bin.binSkus && bin.binSkus.length > 0 ? (
                  <div className="space-y-2">
                    {bin.binSkus.map((binSku, index) => (
                      <div
                        key={index}
                        className="border rounded-md p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {/* SKU Image */}
                          <div 
                            className={`w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 ${
                              binSku.sku?.imageUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                            }`}
                            onClick={() => binSku.sku?.imageUrl && handleSkuImageClick(binSku.sku.imageUrl, binSku.sku.name || 'Unknown SKU')}
                          >
                            {binSku.sku?.imageUrl ? (
                              <img
                                src={binSku.sku.imageUrl}
                                alt={binSku.sku.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* SKU Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-gray-900 truncate text-sm">
                                  {binSku.sku?.name || "Unknown SKU"}
                                </h3>
                                <p className="text-xs text-gray-500 truncate">
                                  {binSku.sku?.description || "No description"}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {editingSkuId === binSku.sku?.id ? (
                                  <div className="flex items-center space-x-1">
                                    <Input
                                      type="number"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(e.target.value)}
                                      className="w-14 h-7 text-xs"
                                      min="1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSaveQuantity(bin.id, binSku.sku!.id)}
                                      disabled={updateQuantityMutation.isPending}
                                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleCancelEdit}
                                      className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <Badge variant="secondary" className="text-sm px-2 py-0.5">
                                      {binSku.quantity}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditQuantity(binSku.sku!.id, binSku.quantity)}
                                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveSku(bin.id, binSku.sku!.id, binSku.sku!.name)}
                                      disabled={removeSkuMutation.isPending}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">No SKUs</h3>
                    <p className="text-sm text-gray-500">This bin doesn't contain any SKUs yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add SKU Dialog */}
      <Dialog open={isAddSkuDialogOpen} onOpenChange={setIsAddSkuDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add SKU to Bin</DialogTitle>
            <DialogDescription>
              Select an SKU and specify the quantity to add to this bin.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addSkuForm}>
            <form onSubmit={addSkuForm.handleSubmit(handleAddSku)} className="space-y-4">
              <FormField
                control={addSkuForm.control}
                name="skuId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <Select
                      value={field.value?.toString() || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? 0 : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an SKU" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none" disabled>
                          {availableSkus.length === 0 ? "No SKUs available" : "Select an SKU"}
                        </SelectItem>
                        {availableSkus.map((sku) => (
                          <SelectItem key={sku.id} value={sku.id.toString()}>
                            {sku.name} ({sku.skuNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addSkuForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseAddSkuDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addSkuToBinMutation.isPending || availableSkus.length === 0}
                >
                  Add SKU
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Modal */}
      {bin.imageUrl && (
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/90" aria-describedby="image-description">
            <DialogHeader className="sr-only">
              <DialogTitle>Bin Image - {bin.name || bin.binNumber}</DialogTitle>
              <DialogDescription id="image-description">
                Full size view of the bin image. Press Escape or click the X button to close.
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={bin.imageUrl}
                alt={bin.name || bin.binNumber}
                className="max-w-full max-h-full object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setIsImageModalOpen(false)}
                aria-label="Close image"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* SKU Image Modal */}
      {selectedSkuImage && (
        <Dialog open={isSkuImageModalOpen} onOpenChange={setIsSkuImageModalOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/90" aria-describedby="sku-image-description">
            <DialogHeader className="sr-only">
              <DialogTitle>SKU Image - {selectedSkuImage.name}</DialogTitle>
              <DialogDescription id="sku-image-description">
                Full size view of the SKU image. Press Escape or click the X button to close.
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={selectedSkuImage.url}
                alt={selectedSkuImage.name}
                className="max-w-full max-h-full object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setIsSkuImageModalOpen(false)}
                aria-label="Close image"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}