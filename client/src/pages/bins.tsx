import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, Box, ArrowLeft } from "lucide-react";
import { BinModal } from "@/components/modals/bin-modal";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Bin, Pallet } from "@shared/schema";

export default function Bins() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract pallet filter from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const palletFilter = urlParams.get('pallet');
  const filteredPalletId = palletFilter ? parseInt(palletFilter) : null;
  
  // Debug logging
  console.log('Bins page - URL params:', {
    fullLocation: location,
    windowLocation: window.location.href,
    windowSearch: window.location.search,
    urlParams: Object.fromEntries(urlParams.entries()),
    palletFilter,
    filteredPalletId
  });

  const { data: bins, isLoading } = useQuery<Bin[]>({
    queryKey: ["/api/bins"],
  });

  const { data: pallets } = useQuery<Pallet[]>({
    queryKey: ["/api/pallets"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Bin deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bin",
        variant: "destructive",
      });
    },
  });

  const filteredBins = bins?.filter((bin) => {
    // Apply search filter
    const matchesSearch = (bin.name || bin.binNumber).toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.binNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply pallet filter if specified
    const matchesPallet = filteredPalletId ? bin.palletId === filteredPalletId : true;
    
    // Debug logging
    if (filteredPalletId) {
      console.log(`Filtering bins for pallet ${filteredPalletId}:`, {
        binId: bin.id,
        binName: bin.name || bin.binNumber,
        binPalletId: bin.palletId,
        matchesPallet,
        finalMatch: matchesSearch && matchesPallet
      });
    }
    
    return matchesSearch && matchesPallet;
  }) || [];

  const getFilteredPalletName = () => {
    if (!filteredPalletId) return null;
    const pallet = pallets?.find(p => p.id === filteredPalletId);
    return pallet?.name || pallet?.palletNumber || "Unknown Pallet";
  };

  const getPalletName = (palletId: number | null) => {
    if (!palletId) return "Unassigned";
    const pallet = pallets?.find(p => p.id === palletId);
    return pallet?.name || pallet?.palletNumber || "Unknown";
  };

  const handleEdit = (bin: Bin) => {
    setEditingBin(bin);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this bin?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBin(null);
  };

  return (
    <>
      {filteredPalletId && (
        <Card className="shadow-md mb-4">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/pallets">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Pallets
                  </Button>
                </Link>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Bins in {getFilteredPalletName()}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Showing {filteredBins.length} bin{filteredBins.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Link href="/bins">
                <Button variant="outline" size="sm">
                  View All Bins
                </Button>
              </Link>
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
                  placeholder="Search bins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Bin
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
                  </div>
                ))}
              </div>
            </div>
          ) : filteredBins.length === 0 ? (
            <div className="p-12 text-center">
              <Box className="mx-auto h-24 w-24 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No bins found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first bin."}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bin
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pallet</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBins.map((bin) => (
                    <TableRow key={bin.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <Box className="h-5 w-5 text-orange-600 mr-3" />
                          <Link href={`/skus?bin=${bin.id}`}>
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline">
                              {bin.name || bin.binNumber}
                            </span>
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {getPalletName(bin.palletId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(bin)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(bin.id)}
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

      <BinModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        bin={editingBin}
      />
    </>
  );
}
