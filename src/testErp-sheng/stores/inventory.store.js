import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { INITIAL_RAW_MATERIALS, INITIAL_SKUS } from '../data/initialData';
import { StorageService } from '../services/storage.service';
export const useInventoryStore = defineStore('inventory', () => {
    const rawMaterials = ref(StorageService.get('raw_materials', INITIAL_RAW_MATERIALS));
    const skus = ref(StorageService.get('skus', INITIAL_SKUS));
    // Computed
    const lowStockMaterials = computed(() => rawMaterials.value.filter((m) => m.stock <= m.minStock));
    const totalRawValuation = computed(() => {
        return rawMaterials.value.reduce((sum, m) => sum + m.stock * m.unitCost, 0);
    });
    const totalSkuCount = computed(() => skus.value.length);
    const totalMaterialCount = computed(() => rawMaterials.value.length);
    // Actions
    function saveState() {
        StorageService.set('raw_materials', rawMaterials.value);
        StorageService.set('skus', skus.value);
    }
    function addRawMaterial(mat) {
        const newMat = {
            ...mat,
            id: `mat-${Date.now()}`,
        };
        rawMaterials.value = [newMat, ...rawMaterials.value];
        saveState();
    }
    function updateRawMaterialStock(id, newStock) {
        rawMaterials.value = rawMaterials.value.map((m) => {
            if (m.id === id) {
                const stock = Math.max(0, newStock);
                return {
                    ...m,
                    stock,
                    status: stock <= m.minStock ? 'low' : 'sufficient',
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
     * Automatic BOM Deduction based on order items
     */
    function deductBOMForItems(items) {
        rawMaterials.value = rawMaterials.value.map((mat) => {
            let deductAmount = 0;
            items.forEach((item) => {
                const matchedSku = skus.value.find((s) => s.name.includes(item.name) || item.name.includes(s.name));
                if (matchedSku) {
                    const comp = matchedSku.components.find((c) => c.rawMaterialId === mat.id || c.name === mat.name);
                    if (comp) {
                        deductAmount += comp.qty * item.quantity;
                    }
                }
            });
            if (deductAmount > 0) {
                const updatedStock = Math.max(0, mat.stock - deductAmount);
                return {
                    ...mat,
                    stock: updatedStock,
                    status: updatedStock <= mat.minStock ? 'low' : 'sufficient',
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
