import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, MapPin, Trash2, ArrowLeft, Upload, FileDown } from "lucide-react";
import { SkuModal } from "@/components/modals/sku-modal";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Sku, Bin, SkuWithLocations } from "@shared/schema";

export default function Skus() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<Sku | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract bin filter from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const binFilter = urlParams.get('bin');
  const filteredBinId = binFilter ? parseInt(binFilter) : null;

  const { data: skus, isLoading } = useQuery<Sku[]>({
    queryKey: ["/api/skus"],
  });

  const { data: bins } = useQuery<Bin[]>({
    queryKey: ["/api/bins"],
  });

  // For bin filtering, we need SKUs with their location information
  const { data: skusWithLocations } = useQuery<SkuWithLocations[]>({
    queryKey: ["/api/skus"],
    select: (skus) => skus.map(sku => sku as SkuWithLocations),
    enabled: !!filteredBinId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/skus/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "SKU deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete SKU",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      const response = await fetch('/api/skus/import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: `Imported ${data.imported} SKUs successfully`,
      });
      setIsImportDialogOpen(false);
      setImportFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import SKUs",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate(importFile);
  };

  const downloadTemplate = () => {
    const csvContent = "name,description\nSample Product,This is a sample product description\nAnother Product,Another sample description";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sku_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredSkus = skus?.filter((sku) => {
    // Apply search filter
    const matchesSearch = sku.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.skuNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply bin filter if specified - this requires checking if SKU is in the specific bin
    if (filteredBinId && skusWithLocations) {
      const skuWithLocation = skusWithLocations.find(s => s.id === sku.id);
      const isInBin = skuWithLocation?.binSkus?.some(bs => bs.bin?.id === filteredBinId);
      return matchesSearch && isInBin;
    }
    
    return matchesSearch;
  }) || [];

  const getFilteredBinName = () => {
    if (!filteredBinId) return null;
    const bin = bins?.find(b => b.id === filteredBinId);
    return bin?.name || bin?.binNumber || "Unknown Bin";
  };

  const handleEdit = (sku: Sku) => {
    setEditingSku(sku);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this SKU?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSku(null);
  };

  return (
    <>
      {filteredBinId && (
        <Card className="shadow-md mb-4">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    window.location.href = '/bins';
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Bins
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    SKUs in {getFilteredBinName()}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Showing {filteredSkus.length} SKU{filteredSkus.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  window.location.href = '/skus';
                }}
              >
                View All SKUs
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <Card className="shadow-md">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search SKUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add SKU
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(true)} 
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredSkus.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No SKUs found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first SKU."}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add SKU
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSkus.map((sku) => (
                    <TableRow key={sku.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          {sku.imageUrl ? (
                            <img
                              src={sku.imageUrl}
                              alt={sku.name}
                              className="h-10 w-10 rounded-md object-cover mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {sku.name}
                            </span>
                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                              {sku.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-gray-900">
                          {sku.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {sku.price ? (
                          <span className="text-sm font-medium text-gray-900">
                            ₹{sku.price}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(sku)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(sku.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SkuModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sku={editingSku}
      />

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import SKUs from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with name and description columns to import SKUs. Column headers are case insensitive. SKU numbers will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="csv-upload" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">CSV files only</p>
                  {importFile && (
                    <p className="mt-2 text-sm text-blue-600 font-medium">{importFile.name}</p>
                  )}
                </div>
                <input 
                  id="csv-upload" 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="flex items-center"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImportDialogOpen(false);
                    setImportFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importMutation.isPending}
                >
                  {importMutation.isPending ? "Importing..." : "Import"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
