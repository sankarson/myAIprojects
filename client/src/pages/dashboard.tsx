import { useQuery } from "@tanstack/react-query";
import { useEffect, useCallback, useRef, useState } from "react";
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
  const activityRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [allActivities, setAllActivities] = useState<ActivityLog[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity", offset],
    queryFn: async () => {
      const response = await fetch(`/api/activity?offset=${offset}&limit=20`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      const newActivities = await response.json();
      
      if (offset === 0) {
        setAllActivities(newActivities);
      } else {
        setAllActivities(prev => [...prev, ...newActivities]);
      }
      
      setHasMore(newActivities.length === 20);
      return newActivities;
    },
  });

  const displayActivities = allActivities;

  const handleScroll = useCallback(() => {
    if (!activityRef.current || !hasMore || activitiesLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = activityRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setOffset(prev => prev + 20);
    }
  }, [hasMore, activitiesLoading]);

  useEffect(() => {
    const element = activityRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

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
    <div className="h-full flex flex-col space-y-8">
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
      <Card className="shadow-md flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Activity Log
          </h3>
        </div>
        <CardContent className="p-0 flex-1 flex flex-col">
          {activitiesLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayActivities && displayActivities.length > 0 ? (
            <div 
              ref={activityRef}
              className="divide-y divide-gray-200 flex-1 overflow-y-auto"
            >
              {displayActivities.map((activity) => {
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
                  <div key={activity.id} className="px-3 py-1.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className={`p-1 rounded-full ${getBgColor(activity.action)}`}>
                          {getIcon(activity.action)}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                          .replace(' minutes', 'm')
                          .replace(' minute', 'm')
                          .replace(' hours', 'h')
                          .replace(' hour', 'h')
                          .replace(' days', 'd')
                          .replace(' day', 'd')}
                      </p>
                    </div>
                  </div>
                );
              })}
              {hasMore && (
                <div className="px-3 py-2 border-t border-gray-200">
                  {activitiesLoading && offset > 0 ? (
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-300"></div>
                      <span className="text-xs">Loading more...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOffset(prev => prev + 20)}
                      className="w-full py-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      disabled={activitiesLoading}
                    >
                      Load More Activities
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 flex-1 flex flex-col justify-center">
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
