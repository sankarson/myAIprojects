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
import { Package, MapPin, Edit, Trash2, Check, X, Plus, Warehouse } from "lucide-react";
import { type PalletWithBins, type Bin, insertBinSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const addBinFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type AddBinFormData = z.infer<typeof addBinFormSchema>;

export default function PalletDetail() {
  const [location, setLocation] = useLocation();
  const palletId = new URLSearchParams(window.location.search).get('id');
  const { toast } = useToast();
  
  // State for editing bin names
  const [editingBinId, setEditingBinId] = useState<number | null>(null);
  const [editBinName, setEditBinName] = useState<string>("");
  
  // State for Add Bin dialog
  const [isAddBinDialogOpen, setIsAddBinDialogOpen] = useState(false);

  const { data: pallet, isLoading } = useQuery<PalletWithBins>({
    queryKey: [`/api/pallets/${palletId}`],
    enabled: !!palletId,
  });

  // Form for adding bins
  const addBinForm = useForm<AddBinFormData>({
    resolver: zodResolver(addBinFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Mutation for updating bin name
  const updateBinMutation = useMutation({
    mutationFn: async ({ binId, name }: { binId: number; name: string }) => {
      await apiRequest("PUT", `/api/bins/${binId}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pallets/${palletId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "Bin name updated successfully",
      });
      setEditingBinId(null);
      setEditBinName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bin name",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing bin from pallet
  const removeBinMutation = useMutation({
    mutationFn: async ({ binId }: { binId: number }) => {
      await apiRequest("DELETE", `/api/bins/${binId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pallets/${palletId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "Bin deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bin",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding bin to pallet
  const addBinToPalletMutation = useMutation({
    mutationFn: async ({ palletId, name, imageUrl }: { palletId: number; name: string; imageUrl?: string }) => {
      await apiRequest("POST", "/api/bins", { name, palletId, imageUrl: imageUrl || "" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pallets/${palletId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "Bin added to pallet successfully",
      });
      setIsAddBinDialogOpen(false);
      addBinForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bin to pallet",
        variant: "destructive",
      });
    },
  });

  const handleEditBinName = (binId: number, currentName: string) => {
    setEditingBinId(binId);
    setEditBinName(currentName);
  };

  const handleSaveBinName = (binId: number) => {
    if (!editBinName.trim()) {
      toast({
        title: "Error",
        description: "Bin name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    updateBinMutation.mutate({ binId, name: editBinName });
  };

  const handleCancelEdit = () => {
    setEditingBinId(null);
    setEditBinName("");
  };

  const handleRemoveBin = (binId: number, binName: string) => {
    if (confirm(`Are you sure you want to delete "${binName}"? This will also remove all SKUs in the bin.`)) {
      removeBinMutation.mutate({ binId });
    }
  };

  const handleAddBin = (data: AddBinFormData) => {
    if (!palletId) return;
    addBinToPalletMutation.mutate({
      palletId: parseInt(palletId),
      name: data.name,
    });
  };

  const handleCloseAddBinDialog = () => {
    setIsAddBinDialogOpen(false);
    addBinForm.reset();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pallet Not Found</h1>
          <p className="text-gray-500">The requested pallet could not be found.</p>
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
              {/* Pallet Icon */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {pallet.name || pallet.palletNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  {pallet.palletNumber} • {pallet.bins?.length || 0} Bins
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {pallet.warehouse && (
                <Badge variant="outline" className="flex items-center">
                  <Warehouse className="h-3 w-3 mr-1" />
                  {pallet.warehouse.name}
                </Badge>
              )}
              <Button
                onClick={() => setIsAddBinDialogOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bin
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl">
          {/* Bins List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Bins in this Pallet ({pallet.bins?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pallet.bins && pallet.bins.length > 0 ? (
                  <div className="space-y-4">
                    {pallet.bins.map((bin, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Bin Image */}
                          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
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

                          {/* Bin Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                {editingBinId === bin.id ? (
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      value={editBinName}
                                      onChange={(e) => setEditBinName(e.target.value)}
                                      className="text-lg font-medium"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSaveBinName(bin.id)}
                                      disabled={updateBinMutation.isPending}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleCancelEdit}
                                      className="text-gray-600 hover:text-gray-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <h3 
                                    className="font-medium text-gray-900 truncate cursor-pointer text-blue-600 hover:text-blue-800 underline"
                                    onClick={() => {
                                      window.location.href = `/bin-detail?id=${bin.id}`;
                                    }}
                                  >
                                    {bin.name || bin.binNumber}
                                  </h3>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                  {bin.binNumber}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 ml-4">
                                {editingBinId !== bin.id && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditBinName(bin.id, bin.name || bin.binNumber)}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveBin(bin.id, bin.name || bin.binNumber)}
                                      disabled={removeBinMutation.isPending}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Bins</h3>
                    <p className="text-gray-500">This pallet doesn't contain any bins yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Bin Dialog */}
      <Dialog open={isAddBinDialogOpen} onOpenChange={setIsAddBinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bin to Pallet</DialogTitle>
            <DialogDescription>
              Create a new bin and add it to this pallet.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addBinForm}>
            <form onSubmit={addBinForm.handleSubmit(handleAddBin)} className="space-y-4">
              <FormField
                control={addBinForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bin Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter bin name"
                        {...field}
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
                  onClick={handleCloseAddBinDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addBinToPalletMutation.isPending}
                >
                  Add Bin
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


    </div>
  );
}