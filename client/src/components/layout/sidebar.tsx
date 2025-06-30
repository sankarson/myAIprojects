import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Building, Package, Box, BarChart3, Warehouse, Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg flex-shrink-0 transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-200 flex items-center justify-between`}>
        {!isCollapsed && (
          <h1 className="text-xl font-semibold text-gray-900 flex items-center">
            <Warehouse className="text-primary mr-2" />
            Mynx Inventory
          </h1>
        )}
        {isCollapsed && (
          <Warehouse className="text-primary mx-auto" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 h-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className={`mt-6 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`group flex items-center ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2'} text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-primary"
                      : "text-gray-700 hover:text-gray-900 hover:bg-blue-50/50"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && item.name}
                </div>
              </Link>
            );
          })}
          
          {!isCollapsed && (
            <div className="mt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tools
              </h3>
              <div className="mt-2 space-y-1">
                {toolItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      <div className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-blue-50/50 transition-colors cursor-pointer">
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mt-6 space-y-1">
              {toolItems.map((item) => {
                const Icon = item.icon;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <div 
                      className="group flex items-center px-2 py-3 justify-center text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      title={item.name}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
