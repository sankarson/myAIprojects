import { useState } from "react";
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

  const { data: skus = [], isLoading } = useQuery<SkuWithImageStatus[]>({
    queryKey: ["/api/skus"],
    select: (data: Sku[]) => data.map(sku => ({
      ...sku,
      hasImage: !!sku.imageUrl
    }))
  });

  const updateSkuMutation = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: number; imageUrl: string }) => {
      const response = await apiRequest("PATCH", `/api/skus/${id}`, { imageUrl });
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/skus/${id}`, { imageUrl: null });
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
      await updateSkuMutation.mutateAsync({ 
        id: skuId, 
        imageUrl: uploadResult.imageUrl 
      });
    } catch (error) {
      console.error("Image upload failed:", error);
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
  );

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">SKU Image Management</h1>
        <p className="text-muted-foreground">
          Manage product images for all SKUs - view, edit, or delete images
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SKUs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-2xl font-bold text-foreground">{filteredSkus.length}</p>
              </div>
              <Image className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Images</p>
                <p className="text-2xl font-bold text-green-600">{skusWithImages.length}</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {filteredSkus.length > 0 ? Math.round((skusWithImages.length / filteredSkus.length) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Without Images</p>
                <p className="text-2xl font-bold text-amber-600">{skusWithoutImages.length}</p>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Missing
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SKUs with Images */}
      {skusWithImages.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="h-5 w-5 mr-2" />
              SKUs with Images ({skusWithImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {skusWithImages.map((sku) => (
                <div key={sku.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-square mb-3 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                    <img
                      src={sku.imageUrl ?? ""}
                      alt={sku.name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setSelectedImage(sku.imageUrl || "")}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground truncate" title={sku.name}>
                      {sku.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{sku.skuNumber}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedImage(sku.imageUrl || "")}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSkuId(sku.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SKUs without Images */}
      {skusWithoutImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              SKUs without Images ({skusWithoutImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skusWithoutImages.map((sku) => (
                <div key={sku.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-square mb-3 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                    <Image className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground truncate" title={sku.name}>
                      {sku.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{sku.skuNumber}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSkuId(sku.id)}
                      className="w-full"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Add Image
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full-screen Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="max-h-[80vh] overflow-auto">
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
          <DialogContent>
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
          <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
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
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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