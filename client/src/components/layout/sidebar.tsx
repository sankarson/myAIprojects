import { Link, useLocation } from "wouter";
import { Building, Package, Box, BarChart3, Warehouse, Search, FileText } from "lucide-react";

const navigationItems = [
  { name: "Dashboard", path: "/", icon: BarChart3 },
  { name: "Warehouses", path: "/warehouses", icon: Building },
  { name: "Pallets", path: "/pallets", icon: Package },
  { name: "Bins", path: "/bins", icon: Box },
  { name: "SKUs", path: "/skus", icon: Warehouse },
];

const toolItems = [
  { name: "Search Inventory", path: "/search", icon: Search },
  { name: "Export Data", path: "/export", icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          <Warehouse className="text-primary mr-2" />
          Inventory Tracker Pro
        </h1>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-50 text-primary"
                      : "text-gray-700 hover:text-gray-900 hover:bg-blue-50/50"
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </a>
              </Link>
            );
          })}
          
          <div className="mt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tools
            </h3>
            <div className="mt-2 space-y-1">
              {toolItems.map((item) => {
                const Icon = item.icon;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <a className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-blue-50/50 transition-colors">
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
