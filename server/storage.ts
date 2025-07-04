import {
  warehouses,
  pallets,
  bins,
  skus,
  binSkus,
  activityLog,
  type Warehouse,
  type InsertWarehouse,
  type Pallet,
  type InsertPallet,
  type Bin,
  type InsertBin,
  type Sku,
  type InsertSku,
  type BinSku,
  type InsertBinSku,
  type WarehouseWithPallets,
  type PalletWithBins,
  type BinWithSkus,
  type SkuWithLocations,
  type ActivityLog,
  type InsertActivityLog,
  users,
  type User,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User methods (legacy)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Warehouse methods
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouseById(id: number): Promise<WarehouseWithPallets | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: number): Promise<void>;

  // Pallet methods
  getPallets(): Promise<Pallet[]>;
  getPalletById(id: number): Promise<PalletWithBins | undefined>;
  createPallet(pallet: InsertPallet): Promise<Pallet>;
  updatePallet(id: number, pallet: Partial<InsertPallet>): Promise<Pallet>;
  deletePallet(id: number): Promise<void>;

  // Bin methods
  getBins(): Promise<(Bin & { itemCount: number })[]>;
  getBinById(id: number): Promise<BinWithSkus | undefined>;
  createBin(bin: InsertBin): Promise<Bin>;
  updateBin(id: number, bin: Partial<InsertBin>): Promise<Bin>;
  deleteBin(id: number): Promise<void>;

  // SKU methods
  getSkus(): Promise<Sku[]>;
  getSkusWithTrunks(): Promise<Array<Sku & { trunks: Array<{ binId: number; binNumber: string; binName: string; quantity: number }> }>>;
  getSkuById(id: number): Promise<SkuWithLocations | undefined>;
  createSku(sku: InsertSku): Promise<Sku>;
  updateSku(id: number, sku: Partial<InsertSku>): Promise<Sku>;
  deleteSku(id: number): Promise<void>;

  // BinSku methods
  addSkuToBin(binSku: InsertBinSku): Promise<BinSku>;
  updateBinSkuQuantity(binId: number, skuId: number, quantity: number): Promise<BinSku>;
  removeSkuFromBin(binId: number, skuId: number): Promise<void>;

  // Statistics
  getStats(): Promise<{
    warehouses: number;
    pallets: number;
    bins: number;
    skus: number;
  }>;

  // Activity Log methods
  logActivity(activity: InsertActivityLog): Promise<void>;
  getRecentActivity(limit?: number, offset?: number): Promise<ActivityLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods (legacy)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Warehouse methods
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).orderBy(warehouses.name);
  }

  async getWarehouseById(id: number): Promise<WarehouseWithPallets | undefined> {
    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
      with: {
        pallets: true,
      },
    });
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db
      .insert(warehouses)
      .values(warehouse)
      .returning();
    
    // Log activity
    await this.logActivity({
      action: "CREATE",
      entityType: "warehouse",
      entityId: newWarehouse.id,
      entityName: newWarehouse.name,
      description: `Created warehouse "${newWarehouse.name}"`
    });
    
    return newWarehouse;
  }

  async updateWarehouse(
    id: number,
    warehouse: Partial<InsertWarehouse>
  ): Promise<Warehouse> {
    // Get original values before updating
    const [original] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    
    const [updated] = await db
      .update(warehouses)
      .set(warehouse)
      .where(eq(warehouses.id, id))
      .returning();
    
    // Build change description
    const changes: string[] = [];
    if (warehouse.name && warehouse.name !== original.name) {
      changes.push(`name: "${original.name}" → "${warehouse.name}"`);
    }
    if (warehouse.address && warehouse.address !== original.address) {
      changes.push(`address: "${original.address}" → "${warehouse.address}"`);
    }
    
    // Log activity
    await this.logActivity({
      action: "UPDATE",
      entityType: "warehouse",
      entityId: updated.id,
      entityName: updated.name,
      description: `Updated warehouse "${updated.name}"${changes.length > 0 ? ` (${changes.join(', ')})` : ''}`
    });
    
    return updated;
  }

  async deleteWarehouse(id: number): Promise<void> {
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }

  // Pallet methods
  async getPallets(): Promise<Pallet[]> {
    return await db.select().from(pallets).orderBy(pallets.palletNumber);
  }

  async getPalletById(id: number): Promise<PalletWithBins | undefined> {
    const pallet = await db.query.pallets.findFirst({
      where: eq(pallets.id, id),
      with: {
        bins: true,
        warehouse: true,
      },
    });
    if (!pallet) return undefined;
    return {
      ...pallet,
      warehouse: pallet.warehouse || undefined,
    };
  }

  async createPallet(pallet: InsertPallet): Promise<Pallet> {
    // Generate sequential pallet number
    const result = await db.execute(
      sql`SELECT COALESCE(MAX(CAST(SUBSTRING(pallet_number FROM 4) AS INTEGER)), 0) + 1 as next_num FROM pallets`
    );
    const nextNum = (result.rows[0] as any).next_num;
    const palletNumber = `PLT${nextNum.toString().padStart(7, "0")}`;

    // Use provided name or default to pallet number
    const name = pallet.name || palletNumber;

    const [newPallet] = await db
      .insert(pallets)
      .values({ ...pallet, palletNumber, name })
      .returning();
    
    // Log activity
    await this.logActivity({
      action: "CREATE",
      entityType: "pallet",
      entityId: newPallet.id,
      entityName: newPallet.name || newPallet.palletNumber,
      description: `Created pallet "${newPallet.name || newPallet.palletNumber}"`
    });
    
    return newPallet;
  }

  async updatePallet(
    id: number,
    pallet: Partial<InsertPallet>
  ): Promise<Pallet> {
    // Get original values before updating
    const [original] = await db.select().from(pallets).where(eq(pallets.id, id));
    
    const [updated] = await db
      .update(pallets)
      .set(pallet)
      .where(eq(pallets.id, id))
      .returning();
    
    // Build change description
    const changes: string[] = [];
    if (pallet.name && pallet.name !== original.name) {
      changes.push(`name: "${original.name}" → "${pallet.name}"`);
    }
    if (pallet.warehouseId && pallet.warehouseId !== original.warehouseId) {
      // Get warehouse names for meaningful logging
      const [originalWarehouse] = original.warehouseId ? 
        await db.select().from(warehouses).where(eq(warehouses.id, original.warehouseId)) : [null];
      const [newWarehouse] = await db.select().from(warehouses).where(eq(warehouses.id, pallet.warehouseId));
      
      changes.push(`warehouse: "${originalWarehouse?.name || 'none'}" → "${newWarehouse?.name || 'unknown'}"`);
    }
    if (pallet.locationCode && pallet.locationCode !== original.locationCode) {
      changes.push(`location: "${original.locationCode || 'none'}" → "${pallet.locationCode}"`);
    }
    
    // Log activity
    await this.logActivity({
      action: "UPDATE",
      entityType: "pallet",
      entityId: updated.id,
      entityName: updated.name || updated.palletNumber,
      description: `Updated pallet "${updated.name || updated.palletNumber}"${changes.length > 0 ? ` (${changes.join(', ')})` : ''}`
    });
    
    return updated;
  }

  async deletePallet(id: number): Promise<void> {
    await db.delete(pallets).where(eq(pallets.id, id));
  }

  // Bin methods
  async getBins(): Promise<(Bin & { itemCount: number })[]> {
    const result = await db
      .select({
        id: bins.id,
        binNumber: bins.binNumber,
        name: bins.name,
        palletId: bins.palletId,
        imageUrl: bins.imageUrl,
        itemCount: sql<number>`COALESCE(COUNT(${binSkus.id}), 0)`.as('itemCount'),
      })
      .from(bins)
      .leftJoin(binSkus, eq(bins.id, binSkus.binId))
      .groupBy(bins.id, bins.binNumber, bins.name, bins.palletId, bins.imageUrl)
      .orderBy(bins.binNumber);
    
    return result;
  }

  async getBinById(id: number): Promise<BinWithSkus | undefined> {
    const bin = await db.query.bins.findFirst({
      where: eq(bins.id, id),
      with: {
        binSkus: {
          with: {
            sku: true,
          },
        },
        pallet: true,
      },
    });
    if (!bin) return undefined;
    return {
      ...bin,
      pallet: bin.pallet || undefined,
    };
  }

  async createBin(bin: InsertBin): Promise<Bin> {
    // Generate sequential bin number
    const result = await db.execute(
      sql`SELECT COALESCE(MAX(CAST(SUBSTRING(bin_number FROM 4) AS INTEGER)), 0) + 1 as next_num FROM bins`
    );
    const nextNum = (result.rows[0] as any).next_num;
    const binNumber = `BIN${nextNum.toString().padStart(7, "0")}`;

    // Use provided name or default to bin number
    const name = bin.name || binNumber;

    const [newBin] = await db
      .insert(bins)
      .values({ ...bin, binNumber, name })
      .returning();
    
    // Log activity
    await this.logActivity({
      action: "CREATE",
      entityType: "bin",
      entityId: newBin.id,
      entityName: newBin.name || newBin.binNumber,
      description: `Created bin "${newBin.name || newBin.binNumber}"`
    });
    
    return newBin;
  }

  async updateBin(id: number, bin: Partial<InsertBin>): Promise<Bin> {
    // Get original values before updating
    const [original] = await db.select().from(bins).where(eq(bins.id, id));
    
    const [updated] = await db
      .update(bins)
      .set(bin)
      .where(eq(bins.id, id))
      .returning();
    
    // Build change description
    const changes: string[] = [];
    if (bin.name && bin.name !== original.name) {
      changes.push(`name: "${original.name}" → "${bin.name}"`);
    }
    if (bin.palletId && bin.palletId !== original.palletId) {
      // Get pallet names for meaningful logging
      const [originalPallet] = original.palletId ? 
        await db.select().from(pallets).where(eq(pallets.id, original.palletId)) : [null];
      const [newPallet] = await db.select().from(pallets).where(eq(pallets.id, bin.palletId));
      
      changes.push(`pallet: "${originalPallet?.name || originalPallet?.palletNumber || 'none'}" → "${newPallet?.name || newPallet?.palletNumber || 'unknown'}"`);
    }
    if (bin.imageUrl !== undefined && bin.imageUrl !== original.imageUrl) {
      if (original.imageUrl && bin.imageUrl) {
        changes.push(`image: updated`);
      } else if (!original.imageUrl && bin.imageUrl) {
        changes.push(`image: added`);
      } else if (original.imageUrl && !bin.imageUrl) {
        changes.push(`image: removed`);
      }
    }
    
    // Log activity
    await this.logActivity({
      action: "UPDATE",
      entityType: "bin",
      entityId: updated.id,
      entityName: updated.name || updated.binNumber,
      description: `Updated bin "${updated.name || updated.binNumber}"${changes.length > 0 ? ` (${changes.join(', ')})` : ''}`
    });
    
    return updated;
  }

  async deleteBin(id: number): Promise<void> {
    await db.delete(bins).where(eq(bins.id, id));
  }

  // SKU methods
  async getSkus(): Promise<Sku[]> {
    return await db.select().from(skus).orderBy(skus.skuNumber);
  }

  async getSkusWithTrunks(): Promise<Array<Sku & { trunks: Array<{ binId: number; binNumber: string; binName: string; quantity: number }> }>> {
    const skusWithLocations = await db.query.skus.findMany({
      with: {
        binSkus: {
          with: {
            bin: true,
          },
        },
      },
      orderBy: skus.skuNumber,
    });

    return skusWithLocations.map(sku => ({
      ...sku,
      trunks: sku.binSkus.map(binSku => ({
        binId: binSku.bin.id,
        binNumber: binSku.bin.binNumber,
        binName: binSku.bin.name || binSku.bin.binNumber,
        quantity: binSku.quantity,
      })),
    }));
  }

  async getSkuById(id: number): Promise<SkuWithLocations | undefined> {
    const sku = await db.query.skus.findFirst({
      where: eq(skus.id, id),
      with: {
        binSkus: {
          with: {
            bin: {
              with: {
                pallet: {
                  with: {
                    warehouse: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!sku) return undefined;
    return {
      ...sku,
      binSkus: sku.binSkus.map(binSku => ({
        ...binSku,
        bin: {
          ...binSku.bin,
          pallet: binSku.bin.pallet ? {
            ...binSku.bin.pallet,
            warehouse: binSku.bin.pallet.warehouse || undefined,
          } : undefined,
        },
      })),
    };
  }

  async createSku(sku: InsertSku): Promise<Sku> {
    // Generate sequential SKU number
    const result = await db.execute(
      sql`SELECT COALESCE(MAX(CAST(SUBSTRING(sku_number FROM 4) AS INTEGER)), 0) + 1 as next_num FROM skus`
    );
    const nextNum = (result.rows[0] as any).next_num;
    const skuNumber = `SKU${nextNum.toString().padStart(7, "0")}`;

    const [newSku] = await db
      .insert(skus)
      .values({ ...sku, skuNumber })
      .returning();
    
    // Log activity
    await this.logActivity({
      action: "CREATE",
      entityType: "sku",
      entityId: newSku.id,
      entityName: newSku.name,
      description: `Created SKU "${newSku.name}"`
    });
    
    return newSku;
  }

  async updateSku(id: number, sku: Partial<InsertSku>): Promise<Sku> {
    // Get original values before updating
    const [original] = await db.select().from(skus).where(eq(skus.id, id));
    
    const [updated] = await db
      .update(skus)
      .set(sku)
      .where(eq(skus.id, id))
      .returning();
    
    // Build change description
    const changes: string[] = [];
    if (sku.name && sku.name !== original.name) {
      changes.push(`name: "${original.name}" → "${sku.name}"`);
    }
    if (sku.description && sku.description !== original.description) {
      changes.push(`description: "${original.description || 'none'}" → "${sku.description}"`);
    }
    if (sku.price && sku.price !== original.price) {
      changes.push(`price: ₹${original.price} → ₹${sku.price}`);
    }
    if (sku.imageUrl !== undefined && sku.imageUrl !== original.imageUrl) {
      if (original.imageUrl && sku.imageUrl) {
        changes.push(`image: updated`);
      } else if (!original.imageUrl && sku.imageUrl) {
        changes.push(`image: added`);
      } else if (original.imageUrl && !sku.imageUrl) {
        changes.push(`image: removed`);
      }
    }
    
    // Log activity
    await this.logActivity({
      action: "UPDATE",
      entityType: "sku",
      entityId: updated.id,
      entityName: updated.name,
      description: `Updated SKU "${updated.name}"${changes.length > 0 ? ` (${changes.join(', ')})` : ''}`
    });
    
    return updated;
  }

  async deleteSku(id: number): Promise<void> {
    // Get SKU details for activity logging before deletion
    const sku = await db.select().from(skus).where(eq(skus.id, id)).limit(1);
    const skuName = sku[0]?.name || `SKU ${id}`;
    
    // First delete all bin_skus entries that reference this SKU
    await db.delete(binSkus).where(eq(binSkus.skuId, id));
    
    // Then delete the SKU itself
    await db.delete(skus).where(eq(skus.id, id));
    
    // Log the activity
    await this.logActivity({
      action: "DELETE",
      entityType: "sku",
      entityId: id,
      entityName: skuName,
      description: `Deleted SKU "${skuName}" and removed from all bins`
    });
  }

  // BinSku methods
  async addSkuToBin(binSku: InsertBinSku): Promise<BinSku> {
    // Check if this SKU already exists in the bin
    const existing = await db
      .select()
      .from(binSkus)
      .where(
        sql`${binSkus.binId} = ${binSku.binId} AND ${binSkus.skuId} = ${binSku.skuId}`
      )
      .limit(1);

    if (existing.length > 0) {
      // If it exists, add to the existing quantity
      const newQuantity = existing[0].quantity + binSku.quantity;
      const [updated] = await db
        .update(binSkus)
        .set({ quantity: newQuantity })
        .where(
          sql`${binSkus.binId} = ${binSku.binId} AND ${binSkus.skuId} = ${binSku.skuId}`
        )
        .returning();
      
      // Get SKU and Bin names for logging
      const [sku] = await db.select().from(skus).where(eq(skus.id, binSku.skuId));
      const [bin] = await db.select().from(bins).where(eq(bins.id, binSku.binId));
      
      // Log activity
      await this.logActivity({
        action: "UPDATE",
        entityType: "inventory",
        entityId: binSku.binId,
        entityName: `${sku?.name || 'Unknown SKU'} in ${bin?.name || bin?.binNumber || 'Unknown Bin'}`,
        description: `Added ${binSku.quantity} units of "${sku?.name || 'Unknown SKU'}" to bin "${bin?.name || bin?.binNumber || 'Unknown Bin'}" (total: ${newQuantity})`
      });
      
      return updated;
    } else {
      // If it doesn't exist, create a new record
      const [newBinSku] = await db.insert(binSkus).values(binSku).returning();
      
      // Get SKU and Bin names for logging
      const [sku] = await db.select().from(skus).where(eq(skus.id, binSku.skuId));
      const [bin] = await db.select().from(bins).where(eq(bins.id, binSku.binId));
      
      // Log activity
      await this.logActivity({
        action: "CREATE",
        entityType: "inventory",
        entityId: binSku.binId,
        entityName: `${sku?.name || 'Unknown SKU'} in ${bin?.name || bin?.binNumber || 'Unknown Bin'}`,
        description: `Added ${binSku.quantity} units of "${sku?.name || 'Unknown SKU'}" to bin "${bin?.name || bin?.binNumber || 'Unknown Bin'}"`
      });
      
      return newBinSku;
    }
  }

  async updateBinSkuQuantity(
    binId: number,
    skuId: number,
    quantity: number
  ): Promise<BinSku> {
    // Get original quantity before updating
    const [original] = await db
      .select()
      .from(binSkus)
      .where(
        sql`${binSkus.binId} = ${binId} AND ${binSkus.skuId} = ${skuId}`
      )
      .limit(1);
    
    const [updated] = await db
      .update(binSkus)
      .set({ quantity })
      .where(
        sql`${binSkus.binId} = ${binId} AND ${binSkus.skuId} = ${skuId}`
      )
      .returning();
    
    // Get SKU and Bin names for logging
    const [sku] = await db.select().from(skus).where(eq(skus.id, skuId));
    const [bin] = await db.select().from(bins).where(eq(bins.id, binId));
    
    // Log activity with quantity change
    if (original) {
      const quantityChange = quantity - original.quantity;
      const changeType = quantityChange > 0 ? 'increased' : 'decreased';
      const changeAmount = Math.abs(quantityChange);
      
      await this.logActivity({
        action: "UPDATE",
        entityType: "inventory",
        entityId: binId,
        entityName: `${sku?.name || 'Unknown SKU'} in ${bin?.name || bin?.binNumber || 'Unknown Bin'}`,
        description: `${changeType === 'increased' ? 'Increased' : 'Decreased'} quantity of "${sku?.name || 'Unknown SKU'}" in bin "${bin?.name || bin?.binNumber || 'Unknown Bin'}" by ${changeAmount} units (${original.quantity} → ${quantity})`
      });
    }
    
    return updated;
  }

  async removeSkuFromBin(binId: number, skuId: number): Promise<void> {
    await db
      .delete(binSkus)
      .where(
        sql`${binSkus.binId} = ${binId} AND ${binSkus.skuId} = ${skuId}`
      );
  }

  // Statistics
  async getStats(): Promise<{
    warehouses: number;
    pallets: number;
    bins: number;
    skus: number;
  }> {
    const [warehouseCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(warehouses);
    const [palletCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pallets);
    const [binCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bins);
    const [skuCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skus);

    return {
      warehouses: warehouseCount.count || 0,
      pallets: palletCount.count || 0,
      bins: binCount.count || 0,
      skus: skuCount.count || 0,
    };
  }

  // Activity Log methods
  async logActivity(activity: InsertActivityLog): Promise<void> {
    await db.insert(activityLog).values(activity);
  }

  async getRecentActivity(limit: number = 20, offset: number = 0): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.timestamp))
      .limit(limit)
      .offset(offset);
  }
}

export const storage = new DatabaseStorage();
