import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

const pageConfig = {
  "/": {
    title: "Dashboard",
    breadcrumb: ["Dashboard", "Overview"],
  },
  "/warehouses": {
    title: "Warehouses",
    breadcrumb: ["Inventory", "Warehouses"],
  },
  "/pallets": {
    title: "Pallets",
    breadcrumb: ["Inventory", "Pallets"],
  },
  "/bins": {
    title: "Bins",
    breadcrumb: ["Inventory", "Bins"],
  },
  "/skus": {
    title: "SKUs",
    breadcrumb: ["Inventory", "SKUs"],
  },
};

export function Header() {
  const [location] = useLocation();
  const config = pageConfig[location as keyof typeof pageConfig] || {
    title: "Inventory Tracker",
    breadcrumb: ["Dashboard"],
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          {config.breadcrumb.map((crumb, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              <span className={index === config.breadcrumb.length - 1 ? "text-gray-900" : ""}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
        
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">{config.title}</h2>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Quick Add
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
