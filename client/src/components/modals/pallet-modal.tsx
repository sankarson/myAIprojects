import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertPalletSchema, type Pallet, type InsertPallet, type Warehouse } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertPalletSchema.extend({
  warehouseId: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  pallet?: Pallet | null;
}

export function PalletModal({ isOpen, onClose, pallet }: PalletModalProps) {
  const { toast } = useToast();
  const isEditing = !!pallet;

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseId: undefined,
      locationCode: "",
    },
  });

  useEffect(() => {
    if (pallet) {
      form.reset({
        warehouseId: pallet.warehouseId || undefined,
        locationCode: pallet.locationCode || "",
      });
    } else {
      form.reset({
        warehouseId: undefined,
        locationCode: "",
      });
    }
  }, [pallet, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertPallet) => {
      const response = await apiRequest("POST", "/api/pallets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Pallet created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pallet",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertPallet>) => {
      const response = await apiRequest("PUT", `/api/pallets/${pallet!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pallets"] });
      toast({
        title: "Success",
        description: "Pallet updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pallet",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData: InsertPallet = {
      warehouseId: data.warehouseId || null,
      locationCode: data.locationCode || null,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Pallet" : "Add New Pallet"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isEditing && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Pallet ID</Label>
                <Input
                  value={pallet?.palletNumber || ""}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">Auto-generated sequential ID</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a warehouse (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No warehouse assigned</SelectItem>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
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
              name="locationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={6}
                      placeholder="A1-001"
                      className="font-mono"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">6-character location code within the warehouse</p>
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
                {isEditing ? "Update Pallet" : "Create Pallet"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
