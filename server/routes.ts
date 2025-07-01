import type { Express } from "express";
import express from "express";
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
import multer from "multer";
import path from "path";
import fs from "fs";
import csvParser from "csv-parser";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'text/csv' || 
                     file.mimetype === 'application/csv' || 
                     file.mimetype === 'text/plain';
    
    if (mimetype || extname || file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  const staticPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', (req, res, next) => {
    express.static(staticPath)(req, res, next);
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl: fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
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

  // Activity log endpoint
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
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

  // SKU CSV Import
  app.post("/api/skus/import", csvUpload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No CSV file uploaded" });
      }

      const filePath = req.file.path;
      const results: Array<{ name: string; description: string }> = [];
      const errors: string[] = [];

      // Parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => {
            // Validate required fields
            if (!data.name || !data.description) {
              errors.push(`Row missing required fields: ${JSON.stringify(data)}`);
              return;
            }
            
            results.push({
              name: data.name.toString().trim(),
              description: data.description.toString().trim()
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: "CSV validation failed", 
          details: errors 
        });
      }

      if (results.length === 0) {
        return res.status(400).json({ error: "No valid data found in CSV file" });
      }

      // Import SKUs
      const createdSkus = [];
      for (const skuData of results) {
        try {
          const sku = await storage.createSku({
            name: skuData.name,
            description: skuData.description,
            price: "0", // Default price, can be updated later
            imageUrl: ""
          });
          createdSkus.push(sku);
        } catch (error) {
          console.error("Error creating SKU:", error);
          errors.push(`Failed to create SKU: ${skuData.name}`);
        }
      }

      res.json({
        success: true,
        imported: createdSkus.length,
        total: results.length,
        errors: errors.length > 0 ? errors : undefined,
        skus: createdSkus
      });

    } catch (error) {
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Error importing SKUs:", error);
      res.status(500).json({ error: "Failed to import SKUs from CSV" });
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
