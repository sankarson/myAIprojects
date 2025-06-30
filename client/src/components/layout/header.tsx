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
    breadcrumb: ["Warehouses"],
  },
  "/pallets": {
    title: "Pallets",
    breadcrumb: ["Pallets"],
  },
  "/bins": {
    title: "Bins",
    breadcrumb: ["Bins"],
  },
  "/skus": {
    title: "SKUs",
    breadcrumb: ["SKUs"],
  },
};

export function Header() {
  const [location] = useLocation();
  const config = pageConfig[location as keyof typeof pageConfig] || {
    title: "",
    breadcrumb: ["Dashboard"],
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 md:px-6 py-3 md:py-4 ml-12 md:ml-0">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2 overflow-x-auto">
          {config.breadcrumb.map((crumb, index) => (
            <span key={index} className="flex items-center flex-shrink-0">
              {index > 0 && <span className="mx-1 md:mx-2">/</span>}
              <span className={index === config.breadcrumb.length - 1 ? "text-gray-900" : ""}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 truncate pr-4">{config.title}</h2>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button variant="outline" onClick={handleRefresh} size="sm" className="md:size-default">
              <RefreshCw className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
