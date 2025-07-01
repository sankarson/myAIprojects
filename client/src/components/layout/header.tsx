import { useLocation } from "wouter";

const pageConfig = {
  "/": {
    title: "Dashboard",
  },
  "/warehouses": {
    title: "Warehouses",
  },
  "/pallets": {
    title: "Pallets",
  },
  "/bins": {
    title: "Bins",
  },
  "/skus": {
    title: "SKUs",
  },
};

export function Header() {
  const [location] = useLocation();
  const config = pageConfig[location as keyof typeof pageConfig] || {
    title: "",
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 md:px-6 py-3 md:py-4 ml-12 md:ml-0 pt-[10px] pb-[10px]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 truncate pr-4">{config.title}</h2>
        </div>
      </div>
    </header>
  );
}
