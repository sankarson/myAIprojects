import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Warehouses table
export const warehouses = sqliteTable("warehouses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull(),
});

// Pallets table
export const pallets = sqliteTable("pallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  palletNumber: text("pallet_number").notNull().unique(),
  name: text("name"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationCode: text("location_code"),
});

// Bins table
export const bins = sqliteTable("bins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  binNumber: text("bin_number").notNull().unique(),
  name: text("name"),
  palletId: integer("pallet_id").references(() => pallets.id),
  imageUrl: text("image_url"),
});

// SKUs table
export const skus = sqliteTable("skus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuNumber: text("sku_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price"),
  imageUrl: text("image_url"),
});

// Bin SKUs junction table (for quantities)
export const binSkus = sqliteTable("bin_skus", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  entityType: text("entity_type").notNull(), // warehouse, pallet, bin, sku
  entityId: integer("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  description: text("description").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
