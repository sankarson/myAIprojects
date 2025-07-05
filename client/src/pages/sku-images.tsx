import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Image, Search, Upload, Edit, Trash2, Eye, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Sku } from "@shared/schema";

interface SkuWithImageStatus extends Sku {
  hasImage: boolean;
}

export default function SkuImages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingSkuId, setEditingSkuId] = useState<number | null>(null);
  const { toast } = useToast();

  // Check for SKU query parameter and auto-open edit dialog
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const skuParam = urlParams.get('sku');
    if (skuParam) {
      const skuId = parseInt(skuParam);
      if (!isNaN(skuId)) {
        setEditingSkuId(skuId);
        // Clear the URL parameter without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const { data: skus = [], isLoading } = useQuery<SkuWithImageStatus[]>({
    queryKey: ["/api/skus"],
    select: (data: Sku[]) => data.map(sku => ({
      ...sku,
      hasImage: !!sku.imageUrl
    }))
  });

  const updateSkuMutation = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: number; imageUrl: string }) => {
      console.log("Updating SKU with:", { id, imageUrl });
      const response = await apiRequest("PUT", `/api/skus/${id}`, { imageUrl });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      toast({
        title: "Success",
        description: "SKU image updated successfully"
      });
      setEditingSkuId(null);
    },
    onError: (error: Error) => {
      console.error("Update SKU mutation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/skus/${id}`, { imageUrl: null });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skus"] });
      toast({
        title: "Success",
        description: "SKU image deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleImageUpload = async (file: File, skuId: number) => {
    try {
      const uploadResult = await uploadImageMutation.mutateAsync(file);
      console.log("Upload result:", uploadResult);
      await updateSkuMutation.mutateAsync({ 
        id: skuId, 
        imageUrl: uploadResult.imageUrl 
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleImageUrlUpdate = (skuId: number, imageUrl: string) => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
      return;
    }
    updateSkuMutation.mutate({ id: skuId, imageUrl: imageUrl.trim() });
  };

  const filteredSkus = skus.filter(sku =>
    sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sku.skuNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const skusWithImages = filteredSkus.filter(sku => sku.hasImage);
  const skusWithoutImages = filteredSkus.filter(sku => !sku.hasImage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div className="mb-3 sm:mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">SKU Image Management</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage product images for all SKUs - view, edit, or delete images
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <div className="relative max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SKUs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <Card>
          <CardContent className="p-2">
            <div>
              <p className="text-xs text-muted-foreground">Total SKUs</p>
              <p className="text-base sm:text-lg font-bold text-foreground">{filteredSkus.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">With Images</p>
                <p className="text-base sm:text-lg font-bold text-green-600">{skusWithImages.length}</p>
              </div>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {filteredSkus.length > 0 ? Math.round((skusWithImages.length / filteredSkus.length) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All SKUs Sorted by Name */}
      <Card>
        <CardContent className="p-2">
          {filteredSkus.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 text-muted-foreground">
                <Image className="h-24 w-24" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">No SKUs found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "No SKUs available."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {filteredSkus.map((sku) => (
                <div key={sku.id} className="border rounded-lg p-2 hover:shadow-md transition-shadow">
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground truncate" title={sku.name}>
                        {sku.name}
                      </h3>
                      {sku.imageUrl && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSkuId(sku.id)}
                            className="text-xs px-2 py-1 h-6"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 text-xs px-2 py-1 h-6">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Image</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the image for "{sku.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteImageMutation.mutate(sku.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{sku.skuNumber}</p>
                  </div>
                  <div className="aspect-square mb-2 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                    {sku.imageUrl ? (
                      <img
                        src={sku.imageUrl}
                        alt={sku.name}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setSelectedImage(sku.imageUrl || "")}
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setEditingSkuId(sku.id)}
                        title="Click to add image"
                      >
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {!sku.imageUrl && (
                    <div className="space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSkuId(sku.id)}
                        className="w-full text-xs px-2 py-1"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Add Image
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full-screen Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl w-[95vw] sm:w-auto">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] sm:max-h-[80vh] overflow-auto">
              <img
                src={selectedImage}
                alt="SKU Image"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Image Modal */}
      {editingSkuId && (
        <Dialog open={!!editingSkuId} onOpenChange={() => setEditingSkuId(null)}>
          <DialogContent className="w-[95vw] sm:w-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit SKU Image</DialogTitle>
              <DialogDescription>
                Upload a new image or provide an image URL for this SKU.
              </DialogDescription>
            </DialogHeader>
            <EditImageForm
              sku={skus.find(s => s.id === editingSkuId)!}
              onImageUpload={handleImageUpload}
              onImageUrlUpdate={handleImageUrlUpdate}
              isUploading={uploadImageMutation.isPending}
              isUpdating={updateSkuMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface EditImageFormProps {
  sku: Sku;
  onImageUpload: (file: File, skuId: number) => void;
  onImageUrlUpdate: (skuId: number, imageUrl: string) => void;
  isUploading: boolean;
  isUpdating: boolean;
}

function EditImageForm({ sku, onImageUpload, onImageUrlUpdate, isUploading, isUpdating }: EditImageFormProps) {
  const [imageUrl, setImageUrl] = useState(sku.imageUrl || "");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      onImageUpload(files[0], sku.id);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file, sku.id);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-foreground mb-2">{sku.name}</h3>
        <p className="text-sm text-muted-foreground">{sku.skuNumber}</p>
      </div>

      {/* Current Image */}
      {sku.imageUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Current Image</label>
          <div className="w-24 h-24 sm:w-32 sm:h-32 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={sku.imageUrl}
              alt={sku.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Upload New Image</label>
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
            dragActive 
              ? "border-primary bg-primary/10" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop an image here, or click to select
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Select Image"}
          </label>
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Or enter image URL</label>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={isUpdating}
          />
          <Button
            onClick={() => onImageUrlUpdate(sku.id, imageUrl)}
            disabled={isUpdating || !imageUrl.trim()}
          >
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}