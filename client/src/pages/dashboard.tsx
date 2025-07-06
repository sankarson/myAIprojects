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
  const [allActivities, setAllActivities] = useState<ActivityLog[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
    queryFn: async () => {
      const response = await fetch(`/api/activity?limit=20&offset=0`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      setAllActivities(data);
      setHasMore(data.length === 20);
      return data;
    },
  });

  const loadMoreActivities = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const newOffset = allActivities.length;
      const response = await fetch(`/api/activity?limit=20&offset=${newOffset}`);
      if (!response.ok) throw new Error("Failed to fetch more activities");
      const moreActivities = await response.json();
      
      setAllActivities(prev => [...prev, ...moreActivities]);
      setHasMore(moreActivities.length === 20);
    } catch (error) {
      console.error("Error loading more activities:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayActivities = allActivities;



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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Link href="/warehouses">
          <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Building className="text-primary text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Warehouses</p>
                  <p className="text-2xl font-semibold text-foreground">
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
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Package className="text-green-600 dark:text-green-400 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Pallets</p>
                  <p className="text-2xl font-semibold text-foreground">
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
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <Box className="text-orange-600 dark:text-orange-400 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Bins</p>
                  <p className="text-2xl font-semibold text-foreground">
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
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Warehouse className="text-purple-600 dark:text-purple-400 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">SKUs</p>
                  <p className="text-2xl font-semibold text-foreground">
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
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-medium text-foreground flex items-center">
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
              className="divide-y divide-border flex-1 overflow-y-auto"
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
                  <div key={activity.id} className="px-3 py-1.5 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className={`p-1 rounded-full ${getBgColor(activity.action)}`}>
                          {getIcon(activity.action)}
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.description}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
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
                <div className="px-3 py-2 border-t border-border">
                  <button
                    onClick={loadMoreActivities}
                    disabled={isLoadingMore}
                    className="w-full py-1.5 text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <span>Load More Activities</span>
                    )}
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground flex-1 flex flex-col justify-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Activities will appear here as you manage your inventory</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
