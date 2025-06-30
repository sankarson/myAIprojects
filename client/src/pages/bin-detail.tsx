import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin } from "lucide-react";
import { type BinWithSkus } from "@shared/schema";

export default function BinDetail() {
  const [location, setLocation] = useLocation();
  const binId = new URLSearchParams(window.location.search).get('id');

  const { data: bin, isLoading } = useQuery<BinWithSkus>({
    queryKey: ["/api/bins", binId],
    enabled: !!binId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bin Not Found</h1>
          <Button onClick={() => setLocation("/bins")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bins
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/bins")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bins
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bin.name || bin.binNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  {bin.binNumber} • {bin.binSkus?.length || 0} SKUs
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {bin.pallet && (
                <Badge variant="outline" className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {bin.pallet.name || bin.pallet.palletNumber}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bin Image */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Bin Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bin.imageUrl ? (
                  <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={bin.imageUrl}
                      alt={bin.name || bin.binNumber}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No image available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SKUs List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  SKUs in this Bin ({bin.binSkus?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bin.binSkus && bin.binSkus.length > 0 ? (
                  <div className="space-y-4">
                    {bin.binSkus.map((binSku, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-4">
                          {/* SKU Image */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {binSku.sku?.imageUrl ? (
                              <img
                                src={binSku.sku.imageUrl}
                                alt={binSku.sku.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* SKU Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900 truncate">
                                  {binSku.sku?.name || "Unknown SKU"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {binSku.sku?.skuNumber}
                                </p>
                                {binSku.sku?.description && (
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {binSku.sku.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end ml-4">
                                <Badge variant="secondary" className="mb-2">
                                  Qty: {binSku.quantity}
                                </Badge>
                                {binSku.sku?.price && (
                                  <span className="text-lg font-semibold text-green-600">
                                    ₹{parseFloat(binSku.sku.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No SKUs</h3>
                    <p className="text-gray-500">This bin doesn't contain any SKUs yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}