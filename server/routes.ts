import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertWarehouseSchema,
  insertPalletSchema,
  insertBinSchema,
  insertSkuSchema,
  insertBinSkuSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Warehouse routes
  app.get("/api/warehouses", async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const warehouse = await storage.getWarehouseById(id);
      if (!warehouse) {
        return res.status(404).json({ error: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ error: "Failed to fetch warehouse" });
    }
  });

  app.post("/api/warehouses", async (req, res) => {
    try {
      const warehouse = insertWarehouseSchema.parse(req.body);
      const newWarehouse = await storage.createWarehouse(warehouse);
      res.status(201).json(newWarehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      }
      console.error("Error creating warehouse:", error);
      res.status(500).json({ error: "Failed to create warehouse" });
    }
  });

  app.put("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const warehouse = insertWarehouseSchema.partial().parse(req.body);
      const updated = await storage.updateWarehouse(id, warehouse);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      }
      console.error("Error updating warehouse:", error);
      res.status(500).json({ error: "Failed to update warehouse" });
    }
  });

  app.delete("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWarehouse(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ error: "Failed to delete warehouse" });
    }
  });

  // Pallet routes
  app.get("/api/pallets", async (req, res) => {
    try {
      const pallets = await storage.getPallets();
      res.json(pallets);
    } catch (error) {
      console.error("Error fetching pallets:", error);
      res.status(500).json({ error: "Failed to fetch pallets" });
    }
  });

  app.get("/api/pallets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pallet = await storage.getPalletById(id);
      if (!pallet) {
        return res.status(404).json({ error: "Pallet not found" });
      }
      res.json(pallet);
    } catch (error) {
      console.error("Error fetching pallet:", error);
      res.status(500).json({ error: "Failed to fetch pallet" });
    }
  });

  app.post("/api/pallets", async (req, res) => {
    try {
      const pallet = insertPalletSchema.parse(req.body);
      const newPallet = await storage.createPallet(pallet);
      res.status(201).json(newPallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid pallet data", details: error.errors });
      }
      console.error("Error creating pallet:", error);
      res.status(500).json({ error: "Failed to create pallet" });
    }
  });

  app.put("/api/pallets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pallet = insertPalletSchema.partial().parse(req.body);
      const updated = await storage.updatePallet(id, pallet);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid pallet data", details: error.errors });
      }
      console.error("Error updating pallet:", error);
      res.status(500).json({ error: "Failed to update pallet" });
    }
  });

  app.delete("/api/pallets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePallet(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pallet:", error);
      res.status(500).json({ error: "Failed to delete pallet" });
    }
  });

  // Bin routes
  app.get("/api/bins", async (req, res) => {
    try {
      const bins = await storage.getBins();
      res.json(bins);
    } catch (error) {
      console.error("Error fetching bins:", error);
      res.status(500).json({ error: "Failed to fetch bins" });
    }
  });

  app.get("/api/bins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bin = await storage.getBinById(id);
      if (!bin) {
        return res.status(404).json({ error: "Bin not found" });
      }
      res.json(bin);
    } catch (error) {
      console.error("Error fetching bin:", error);
      res.status(500).json({ error: "Failed to fetch bin" });
    }
  });

  app.post("/api/bins", async (req, res) => {
    try {
      const bin = insertBinSchema.parse(req.body);
      const newBin = await storage.createBin(bin);
      res.status(201).json(newBin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bin data", details: error.errors });
      }
      console.error("Error creating bin:", error);
      res.status(500).json({ error: "Failed to create bin" });
    }
  });

  app.put("/api/bins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bin = insertBinSchema.partial().parse(req.body);
      const updated = await storage.updateBin(id, bin);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bin data", details: error.errors });
      }
      console.error("Error updating bin:", error);
      res.status(500).json({ error: "Failed to update bin" });
    }
  });

  app.delete("/api/bins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBin(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bin:", error);
      res.status(500).json({ error: "Failed to delete bin" });
    }
  });

  // SKU routes
  app.get("/api/skus", async (req, res) => {
    try {
      const skus = await storage.getSkus();
      res.json(skus);
    } catch (error) {
      console.error("Error fetching SKUs:", error);
      res.status(500).json({ error: "Failed to fetch SKUs" });
    }
  });

  app.get("/api/skus/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sku = await storage.getSkuById(id);
      if (!sku) {
        return res.status(404).json({ error: "SKU not found" });
      }
      res.json(sku);
    } catch (error) {
      console.error("Error fetching SKU:", error);
      res.status(500).json({ error: "Failed to fetch SKU" });
    }
  });

  app.post("/api/skus", async (req, res) => {
    try {
      const sku = insertSkuSchema.parse(req.body);
      const newSku = await storage.createSku(sku);
      res.status(201).json(newSku);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid SKU data", details: error.errors });
      }
      console.error("Error creating SKU:", error);
      res.status(500).json({ error: "Failed to create SKU" });
    }
  });

  app.put("/api/skus/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sku = insertSkuSchema.partial().parse(req.body);
      const updated = await storage.updateSku(id, sku);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid SKU data", details: error.errors });
      }
      console.error("Error updating SKU:", error);
      res.status(500).json({ error: "Failed to update SKU" });
    }
  });

  app.delete("/api/skus/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSku(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting SKU:", error);
      res.status(500).json({ error: "Failed to delete SKU" });
    }
  });

  // BinSku routes
  app.post("/api/bins/:binId/skus", async (req, res) => {
    try {
      const binId = parseInt(req.params.binId);
      const binSku = insertBinSkuSchema.parse({ ...req.body, binId });
      const newBinSku = await storage.addSkuToBin(binSku);
      res.status(201).json(newBinSku);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bin SKU data", details: error.errors });
      }
      console.error("Error adding SKU to bin:", error);
      res.status(500).json({ error: "Failed to add SKU to bin" });
    }
  });

  app.put("/api/bins/:binId/skus/:skuId", async (req, res) => {
    try {
      const binId = parseInt(req.params.binId);
      const skuId = parseInt(req.params.skuId);
      const { quantity } = req.body;
      
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than 0" });
      }
      
      const updated = await storage.updateBinSkuQuantity(binId, skuId, quantity);
      res.json(updated);
    } catch (error) {
      console.error("Error updating bin SKU quantity:", error);
      res.status(500).json({ error: "Failed to update SKU quantity" });
    }
  });

  app.delete("/api/bins/:binId/skus/:skuId", async (req, res) => {
    try {
      const binId = parseInt(req.params.binId);
      const skuId = parseInt(req.params.skuId);
      await storage.removeSkuFromBin(binId, skuId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing SKU from bin:", error);
      res.status(500).json({ error: "Failed to remove SKU from bin" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
