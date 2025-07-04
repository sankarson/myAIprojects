import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building, MapPin, Package } from "lucide-react";
import type { WarehouseWithPallets } from "@shared/schema";

export default function WarehouseDetail() {
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const warehouseId = urlParams.get("id");
  const warehouseIdNum = warehouseId ? parseInt(warehouseId, 10) : null;

  const { data: warehouse, isLoading, error } = useQuery<WarehouseWithPallets>({
    queryKey: [`/api/warehouses/${warehouseIdNum}`],
    enabled: !!warehouseIdNum && !isNaN(warehouseIdNum),
  });

  if (!warehouseId || !warehouseIdNum || isNaN(warehouseIdNum)) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-medium text-foreground">Warehouse not found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Invalid warehouse ID provided.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/warehouses")}
        >
          Back to Warehouses
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-medium text-foreground">Error loading warehouse</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Failed to load warehouse details. Please try again.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/warehouses")}
        >
          Back to Warehouses
        </Button>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-medium text-foreground">Warehouse not found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          The warehouse you're looking for doesn't exist.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/warehouses")}
        >
          Back to Warehouses
        </Button>
      </div>
    );
  }

  // Encode address for Google Maps embed
  const encodedAddress = encodeURIComponent(warehouse.address);
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80"
            onClick={() => setLocation("/warehouses")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Warehouses
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{warehouse.name}</h1>
            <div className="flex items-center mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{warehouse.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Warehouse Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Pallets</label>
                <p className="text-foreground">{warehouse.pallets?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pallets List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Pallets ({warehouse.pallets?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {warehouse.pallets && warehouse.pallets.length > 0 ? (
                <div className="space-y-2">
                  {warehouse.pallets.map((pallet) => (
                    <div
                      key={pallet.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/pallet-detail?id=${pallet.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-foreground">
                          {pallet.name || pallet.palletNumber}
                        </span>
                      </div>
                      {pallet.locationCode && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {pallet.locationCode}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No pallets assigned to this warehouse yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Google Map */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-96 rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${warehouse.name}`}
                  onError={() => {
                    console.warn('Google Maps iframe failed to load');
                  }}
                />
              </div>
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                    window.open(googleMapsUrl, '_blank');
                  }}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}