import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, Building } from "lucide-react";
import { WarehouseModal } from "@/components/modals/warehouse-modal";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Warehouse } from "@shared/schema";

export default function Warehouses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const { toast } = useToast();

  const { data: warehouses, isLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "Warehouse deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete warehouse",
        variant: "destructive",
      });
    },
  });

  const filteredWarehouses = warehouses?.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  return (
    <>
      <Card className="shadow-md">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search warehouses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
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
          ) : filteredWarehouses.length === 0 ? (
            <div className="p-12 text-center">
              <Building className="mx-auto h-24 w-24 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No warehouses found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first warehouse."}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Warehouse
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-primary mr-3" />
                          <span className="text-sm font-medium text-gray-900">
                            {warehouse.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {warehouse.address}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(warehouse)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(warehouse.id)}
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

      <WarehouseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        warehouse={editingWarehouse}
      />
    </>
  );
}
