import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit, MapPin, Trash2, ArrowLeft, Upload, FileDown, ChevronUp, ChevronDown } from "lucide-react";
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [skuToDelete, setSkuToDelete] = useState<Sku | null>(null);
  const [selectedSkus, setSelectedSkus] = useState<Set<number>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'description' | 'price'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(
        ids.map(id => apiRequest("DELETE", `/api/skus/${id}`))
      );
      
      const failures = results.filter(result => result.status === 'rejected').length;
      const successes = results.filter(result => result.status === 'fulfilled').length;
      
      return { successes, failures, total: ids.length };
    },
    onSuccess: (result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      setSelectedSkus(new Set());
      
      if (result.failures === 0) {
        toast({
          title: "Success",
          description: `${result.successes} SKUs deleted successfully`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `${result.successes} SKUs deleted, ${result.failures} failed`,
          variant: result.successes > 0 ? "default" : "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete selected SKUs",
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
      
      let description = `Imported ${data.imported} new SKUs successfully`;
      if (data.updated > 0) {
        description += `. Updated ${data.updated} existing SKUs`;
      }
      
      toast({
        title: "Success",
        description,
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
    const csvContent = "name,description,price\nSample Product,This is a sample product description,99.99\nAnother Product,Another sample description,149.50\nFree Product,Free sample product,0";
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

  const handleSort = (field: 'name' | 'description' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
  }).sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'description':
        aValue = (a.description || '').toLowerCase();
        bValue = (b.description || '').toLowerCase();
        break;
      case 'price':
        aValue = parseFloat(a.price || '0');
        bValue = parseFloat(b.price || '0');
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
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

  const handleDelete = (sku: Sku) => {
    setSkuToDelete(sku);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (skuToDelete) {
      deleteMutation.mutate(skuToDelete.id);
      setDeleteConfirmOpen(false);
      setSkuToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSku(null);
  };

  const handleSelectSku = (skuId: number, checked: boolean) => {
    const newSelection = new Set(selectedSkus);
    if (checked) {
      newSelection.add(skuId);
    } else {
      newSelection.delete(skuId);
    }
    setSelectedSkus(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSkuIds = new Set(filteredSkus.map(sku => sku.id));
      setSelectedSkus(allSkuIds);
    } else {
      setSelectedSkus(new Set());
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedSkus.size > 0) {
      bulkDeleteMutation.mutate(Array.from(selectedSkus));
      setBulkDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      {filteredBinId && (
        <Card className="shadow-md mb-3">
          <div className="p-3 md:p-4">
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
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search SKUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)} 
                size="sm" 
                className="whitespace-nowrap"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add SKU
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(true)} 
                size="sm"
                className="whitespace-nowrap"
              >
                <Upload className="mr-1 h-4 w-4" />
                Import CSV
              </Button>
            </div>
            {selectedSkus.size > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedSkus.size} selected
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSkus(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
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
                    <TableHead className="py-3 w-12">
                      <Checkbox
                        checked={selectedSkus.size === filteredSkus.length && filteredSkus.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Select all SKUs"
                      />
                    </TableHead>
                    <TableHead className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="ml-1 h-4 w-4" /> : 
                            <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('description')}
                      >
                        Description
                        {sortField === 'description' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="ml-1 h-4 w-4" /> : 
                            <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort('price')}
                      >
                        Price
                        {sortField === 'price' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="ml-1 h-4 w-4" /> : 
                            <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSkus.map((sku) => (
                    <TableRow key={sku.id} className="hover:bg-gray-50">
                      <TableCell className="py-2">
                        <Checkbox
                          checked={selectedSkus.has(sku.id)}
                          onCheckedChange={(checked) => handleSelectSku(sku.id, checked as boolean)}
                          aria-label={`Select ${sku.name}`}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center">
                          {sku.imageUrl ? (
                            <img
                              src={sku.imageUrl}
                              alt={sku.name}
                              className="h-8 w-8 rounded object-cover mr-2"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center mr-2">
                              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {sku.name}
                            </span>
                            <div className="sm:hidden text-xs text-gray-500">
                              {sku.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2">
                        <span className="text-sm text-gray-900">
                          {sku.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        {sku.price ? (
                          <span className="text-sm font-medium text-gray-900">
                            ₹{sku.price}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(sku)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(sku)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
              Upload a CSV file with name and description columns to import SKUs. Optional price column supported. Column headers are case insensitive. SKU numbers will be auto-generated. Existing SKUs will be updated with new data.
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
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SKU</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{skuToDelete?.name}"? This action cannot be undone and will remove the SKU from all bins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmOpen(false);
              setSkuToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple SKUs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSkus.size} selected SKU{selectedSkus.size !== 1 ? 's' : ''}? This action cannot be undone and will remove all selected SKUs from all bins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete {selectedSkus.size} SKU{selectedSkus.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
