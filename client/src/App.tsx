import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Warehouses from "@/pages/warehouses";
import Pallets from "@/pages/pallets";
import Bins from "@/pages/bins";
import BinDetail from "@/pages/bin-detail";
import Skus from "@/pages/skus";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-3 md:p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/warehouses" component={Warehouses} />
              <Route path="/pallets" component={Pallets} />
              <Route path="/bins" component={Bins} />
              <Route path="/bin-detail" component={BinDetail} />
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
      <TooltipProvider>
        <div className="font-sans">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
