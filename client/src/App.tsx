import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Warehouses from "@/pages/warehouses";
import WarehouseDetail from "@/pages/warehouse-detail";
import Pallets from "@/pages/pallets";
import Bins from "@/pages/bins";
import BinDetail from "@/pages/bin-detail";
import PalletDetail from "@/pages/pallet-detail";
import Skus from "@/pages/skus";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";

function Router() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header />
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-3 md:p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/warehouses" component={Warehouses} />
              <Route path="/warehouse-detail" component={WarehouseDetail} />
              <Route path="/pallets" component={Pallets} />
              <Route path="/bins" component={Bins} />
              <Route path="/bin-detail" component={BinDetail} />
              <Route path="/pallet-detail" component={PalletDetail} />
              <Route path="/skus" component={Skus} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="font-sans">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
