import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { PalletModal } from "@/components/modals/pallet-modal";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Pallet, Warehouse } from "@shared/schema";

export default function Pallets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPallet, setEditingPallet] = useState<Pallet | null>(null);
  const { toast } = useToast();

  const { data: pallets, isLoading } = useQuery<Pallet[]>({
    queryKey: ["/api/pallets"],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pallets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Pallet deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete pallet",
        variant: "destructive",
      });
    },
  });

  const filteredPallets = pallets?.filter(
    (pallet) =>
      pallet.palletNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pallet.locationCode?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getWarehouseName = (warehouseId: number | null) => {
    if (!warehouseId) return "Unassigned";
    const warehouse = warehouses?.find(w => w.id === warehouseId);
    return warehouse?.name || "Unknown";
  };

  const handleEdit = (pallet: Pallet) => {
    setEditingPallet(pallet);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this pallet?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPallet(null);
  };

  return (
    <>
      <Card className="shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Pallet Management</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search pallets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Pallet
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
          ) : filteredPallets.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-24 w-24 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No pallets found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first pallet."}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pallet
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pallet ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPallets.map((pallet) => (
                    <TableRow key={pallet.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-green-600 mr-3" />
                          <span className="font-mono text-sm font-medium">
                            {pallet.palletNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {getWarehouseName(pallet.warehouseId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {pallet.locationCode ? (
                          <Badge variant="secondary" className="font-mono">
                            {pallet.locationCode}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={pallet.warehouseId ? "default" : "secondary"}
                          className={pallet.warehouseId ? "bg-green-100 text-green-800" : ""}
                        >
                          {pallet.warehouseId ? "Assigned" : "Unassigned"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(pallet)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(pallet.id)}
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

      <PalletModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pallet={editingPallet}
      />
    </>
  );
}
