import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Package, Box, Warehouse } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface Stats {
  warehouses: number;
  pallets: number;
  bins: number;
  skus: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Link href="/warehouses">
          <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Building className="text-primary text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Warehouses</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.warehouses || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pallets">
          <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <Package className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Pallets</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.pallets || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bins">
          <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Box className="text-orange-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Bins</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.bins || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/skus">
          <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Warehouse className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">SKUs</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.skus || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Getting Started */}
      <Card className="shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Getting Started</h3>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center py-8">
              <Warehouse className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Start building your inventory
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create warehouses, add pallets, organize bins, and track your SKUs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
