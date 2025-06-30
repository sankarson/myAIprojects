import { pgTable, text, serial, integer, boolean, decimal, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Warehouses table
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
});

// Pallets table
export const pallets = pgTable("pallets", {
  id: serial("id").primaryKey(),
  palletNumber: varchar("pallet_number", { length: 20 }).notNull().unique(),
  name: text("name"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationCode: varchar("location_code", { length: 6 }),
});

// Bins table
export const bins = pgTable("bins", {
  id: serial("id").primaryKey(),
  binNumber: varchar("bin_number", { length: 20 }).notNull().unique(),
  name: text("name"),
  palletId: integer("pallet_id").references(() => pallets.id),
  imageUrl: text("image_url"),
});

// SKUs table
export const skus = pgTable("skus", {
  id: serial("id").primaryKey(),
  skuNumber: varchar("sku_number", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
});

// Bin SKUs junction table (for quantities)
export const binSkus = pgTable("bin_skus", {
  id: serial("id").primaryKey(),
  binId: integer("bin_id").notNull().references(() => bins.id),
  skuId: integer("sku_id").notNull().references(() => skus.id),
  quantity: integer("quantity").notNull(),
});

// Relations
export const warehousesRelations = relations(warehouses, ({ many }) => ({
  pallets: many(pallets),
}));

export const palletsRelations = relations(pallets, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [pallets.warehouseId],
    references: [warehouses.id],
  }),
  bins: many(bins),
}));

export const binsRelations = relations(bins, ({ one, many }) => ({
  pallet: one(pallets, {
    fields: [bins.palletId],
    references: [pallets.id],
  }),
  binSkus: many(binSkus),
}));

export const skusRelations = relations(skus, ({ many }) => ({
  binSkus: many(binSkus),
}));

export const binSkusRelations = relations(binSkus, ({ one }) => ({
  bin: one(bins, {
    fields: [binSkus.binId],
    references: [bins.id],
  }),
  sku: one(skus, {
    fields: [binSkus.skuId],
    references: [skus.id],
  }),
}));

// Insert schemas
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
});

export const insertPalletSchema = createInsertSchema(pallets).omit({
  id: true,
  palletNumber: true,
});

export const insertBinSchema = createInsertSchema(bins).omit({
  id: true,
  binNumber: true,
});

export const insertSkuSchema = createInsertSchema(skus).omit({
  id: true,
  skuNumber: true,
});

export const insertBinSkuSchema = createInsertSchema(binSkus).omit({
  id: true,
});

// Types
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;

export type Pallet = typeof pallets.$inferSelect;
export type InsertPallet = z.infer<typeof insertPalletSchema>;

export type Bin = typeof bins.$inferSelect;
export type InsertBin = z.infer<typeof insertBinSchema>;

export type Sku = typeof skus.$inferSelect;
export type InsertSku = z.infer<typeof insertSkuSchema>;

export type BinSku = typeof binSkus.$inferSelect;
export type InsertBinSku = z.infer<typeof insertBinSkuSchema>;

// Extended types for API responses
export type WarehouseWithPallets = Warehouse & {
  pallets: Pallet[];
};

export type PalletWithBins = Pallet & {
  bins: Bin[];
  warehouse?: Warehouse;
};

export type BinWithSkus = Bin & {
  binSkus: (BinSku & { sku: Sku })[];
  pallet?: Pallet;
};

export type SkuWithLocations = Sku & {
  binSkus: (BinSku & { bin: Bin & { pallet?: Pallet & { warehouse?: Warehouse } } })[];
};

// Legacy user schema (keeping for compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Activity log table for tracking CRUD operations
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
  entityType: varchar("entity_type", { length: 20 }).notNull(), // warehouse, pallet, bin, sku
  entityId: integer("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
