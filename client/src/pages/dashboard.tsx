import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Package, Box, Warehouse, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  warehouses: number;
  pallets: number;
  bins: number;
  skus: number;
}

interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  entityName: string;
  description: string;
  timestamp: string;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
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

      {/* Recent Activity */}
      <Card className="shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
        </div>
        <CardContent className="p-0">
          {activitiesLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {activities.map((activity) => {
                const getIcon = (action: string) => {
                  switch (action) {
                    case 'CREATE':
                      return <Plus className="h-4 w-4 text-green-600" />;
                    case 'UPDATE':
                      return <Edit className="h-4 w-4 text-blue-600" />;
                    case 'DELETE':
                      return <Trash2 className="h-4 w-4 text-red-600" />;
                    default:
                      return <Clock className="h-4 w-4 text-gray-400" />;
                  }
                };

                const getBgColor = (action: string) => {
                  switch (action) {
                    case 'CREATE':
                      return 'bg-green-100';
                    case 'UPDATE':
                      return 'bg-blue-100';
                    case 'DELETE':
                      return 'bg-red-100';
                    default:
                      return 'bg-gray-100';
                  }
                };

                return (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getBgColor(activity.action)}`}>
                        {getIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Activities will appear here as you manage your inventory</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
