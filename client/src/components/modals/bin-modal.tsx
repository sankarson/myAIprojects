import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertBinSchema, type Bin, type InsertBin, type Pallet } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { z } from "zod";

const formSchema = insertBinSchema.extend({
  palletId: z.number().optional(),
  name: z.string().min(1, "Name is required"),
});

type FormData = z.infer<typeof formSchema>;

interface BinModalProps {
  isOpen: boolean;
  onClose: () => void;
  bin?: Bin | null;
}

export function BinModal({ isOpen, onClose, bin }: BinModalProps) {
  const { toast } = useToast();
  const isEditing = !!bin;
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 200);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setUploadedImage(data.imageUrl);
      form.setValue('imageUrl', data.imageUrl);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const { data: pallets } = useQuery<Pallet[]>({
    queryKey: ["/api/pallets"],
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertBin) => {
      const response = await apiRequest("POST", "/api/bins", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "Bin created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bin",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertBin) => {
      const response = await apiRequest("PUT", `/api/bins/${bin!.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Success",
        description: "Bin updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bin",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData: InsertBin = {
      ...data,
      imageUrl: uploadedImage || data.imageUrl || "",
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bin" : "Create New Bin"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update bin information below."
              : "Fill in the details to create a new bin."
            }
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
                      <Input placeholder="Enter bin name" {...field} />
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
                      value={field.value?.toString() || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No pallet</SelectItem>
                        {pallets?.map((pallet) => (
                          <SelectItem key={pallet.id} value={pallet.id.toString()}>
                            {pallet.name || pallet.palletNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Image</Label>
              <div className="mt-2">
                {uploadedImage ? (
                  <div className="relative">
                    <img 
                      src={uploadedImage} 
                      alt="Bin" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
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
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Drop an image here or click to upload
                          </span>
                          <input
                            id="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {isUploading && (
                        <div className="mt-4 space-y-2">
                          <div className="text-sm text-blue-600">
                            Uploading...
                          </div>
                          <Progress value={uploadProgress} className="w-full" />
                          <div className="text-xs text-gray-500 text-center">
                            {Math.round(uploadProgress)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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