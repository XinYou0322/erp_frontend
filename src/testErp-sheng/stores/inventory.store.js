import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { INITIAL_RAW_MATERIALS, INITIAL_SKUS } from "../data/initialData";
import { StorageService } from "../services/storage.service";

export const useInventoryStore = defineStore("inventory", () => {
  // --- State ---
  const rawMaterials = ref(
    StorageService.get("raw_materials", INITIAL_RAW_MATERIALS),
  );
  const skus = ref(StorageService.get("skus", INITIAL_SKUS));

  // --- Computed ---
  const lowStockMaterials = computed(() =>
    rawMaterials.value.filter((m) => m.stock <= m.minStock),
  );

  const totalRawValuation = computed(() =>
    rawMaterials.value.reduce(
      (sum, m) => sum + Number(m.stock) * Number(m.unitCost || 0),
      0,
    ),
  );

  const totalSkuCount = computed(() => skus.value.length);
  const totalMaterialCount = computed(() => rawMaterials.value.length);

  // --- Helpers / Private Methods ---
  function saveState() {
    StorageService.set("raw_materials", rawMaterials.value);
    StorageService.set("skus", skus.value);
  }

  // --- Actions ---
  function addRawMaterial(mat) {
    const newMat = {
      ...mat,
      id: `mat-${Date.now()}`,
      stock: Number(mat.stock || 0),
      minStock: Number(mat.minStock || 0),
      status:
        Number(mat.stock || 0) <= Number(mat.minStock || 0)
          ? "low"
          : "sufficient",
    };
    rawMaterials.value = [newMat, ...rawMaterials.value];
    saveState();
  }

  function updateRawMaterialStock(id, newStock) {
    const targetStock = Math.max(0, Number(newStock));

    rawMaterials.value = rawMaterials.value.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          stock: targetStock,
          status: targetStock <= m.minStock ? "low" : "sufficient",
        };
      }
      return m;
    });
    saveState();
  }

  function addSku(sku) {
    const newSku = {
      ...sku,
      id: `sku-${Date.now()}`,
    };
    skus.value = [newSku, ...skus.value];
    saveState();
  }

  /**
   * 自動 BOM 扣減（高優化效能版）
   * @param {Array} items - 訂單品項，建議格式: [{ skuId, quantity }] 或 [{ name, quantity }]
   */
  function deductBOMForItems(items) {
    // 1. 先計算出這批訂單總共需要扣除哪些原物料與數量 (O(N) 複雜度)
    const deductionMap = new Map(); // key: matId, value: totalDeductQty

    items.forEach((item) => {
      // 優先使用 skuId 匹配，其次才是模糊名稱匹配
      const matchedSku = skus.value.find((s) =>
        item.skuId
          ? s.id === item.skuId
          : s.name.includes(item.name) || item.name.includes(s.name),
      );

      if (!matchedSku || !matchedSku.components) return;

      // 累加該 SKU 內的所有原料消耗量
      matchedSku.components.forEach((comp) => {
        // 優先找原物料 ID，找不到再用名稱對應
        const targetMat = rawMaterials.value.find(
          (m) => m.id === comp.rawMaterialId || m.name === comp.name,
        );
        if (!targetMat) return;

        const currentDeduct = deductionMap.get(targetMat.id) || 0;
        const incrementalDeduct =
          Number(comp.qty || 0) * Number(item.quantity || 0);
        deductionMap.set(targetMat.id, currentDeduct + incrementalDeduct);
      });
    });

    // 2. 一次性更新物料狀態，避免巢狀迴圈 (O(M) 複雜度)
    if (deductionMap.size === 0) return;

    rawMaterials.value = rawMaterials.value.map((mat) => {
      if (deductionMap.has(mat.id)) {
        const deductAmount = deductionMap.get(mat.id);
        const updatedStock = Math.max(0, mat.stock - deductAmount);
        return {
          ...mat,
          stock: updatedStock,
          status: updatedStock <= mat.minStock ? "low" : "sufficient",
        };
      }
      return mat;
    });

    saveState();
  }

  return {
    rawMaterials,
    skus,
    lowStockMaterials,
    totalRawValuation,
    totalSkuCount,
    totalMaterialCount,
    addRawMaterial,
    updateRawMaterialStock,
    addSku,
    deductBOMForItems,
  };
});
