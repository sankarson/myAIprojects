import {
  warehouses,
  pallets,
  bins,
  skus,
  binSkus,
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
    return newWarehouse;
  }

  async updateWarehouse(
    id: number,
    warehouse: Partial<InsertWarehouse>
  ): Promise<Warehouse> {
    const [updated] = await db
      .update(warehouses)
      .set(warehouse)
      .where(eq(warehouses.id, id))
      .returning();
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
    return newPallet;
  }

  async updatePallet(
    id: number,
    pallet: Partial<InsertPallet>
  ): Promise<Pallet> {
    const [updated] = await db
      .update(pallets)
      .set(pallet)
      .where(eq(pallets.id, id))
      .returning();
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
    return newBin;
  }

  async updateBin(id: number, bin: Partial<InsertBin>): Promise<Bin> {
    const [updated] = await db
      .update(bins)
      .set(bin)
      .where(eq(bins.id, id))
      .returning();
    return updated;
  }

  async deleteBin(id: number): Promise<void> {
    await db.delete(bins).where(eq(bins.id, id));
  }

  // SKU methods
  async getSkus(): Promise<Sku[]> {
    return await db.select().from(skus).orderBy(skus.skuNumber);
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
    return newSku;
  }

  async updateSku(id: number, sku: Partial<InsertSku>): Promise<Sku> {
    const [updated] = await db
      .update(skus)
      .set(sku)
      .where(eq(skus.id, id))
      .returning();
    return updated;
  }

  async deleteSku(id: number): Promise<void> {
    await db.delete(skus).where(eq(skus.id, id));
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
      return updated;
    } else {
      // If it doesn't exist, create a new record
      const [newBinSku] = await db.insert(binSkus).values(binSku).returning();
      return newBinSku;
    }
  }

  async updateBinSkuQuantity(
    binId: number,
    skuId: number,
    quantity: number
  ): Promise<BinSku> {
    const [updated] = await db
      .update(binSkus)
      .set({ quantity })
      .where(
        sql`${binSkus.binId} = ${binId} AND ${binSkus.skuId} = ${skuId}`
      )
      .returning();
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
}

export const storage = new DatabaseStorage();
