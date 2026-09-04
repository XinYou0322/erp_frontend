/**
 * =====================================================================
 * 【全域介面狀態管理 (UI Global Store)】: src/stores/ui.store.ts
 * =====================================================================
 * 職責說明：
 * 1. 管理所有全域浮層 (Modals, Drawers) 的開啟與關閉狀態。
 * 2. 提供全域頂部搜尋關鍵字狀態 (globalSearchTerm)。
 * 3. 管理全域性輕量提示訊息 (Toast Notification) 及其自動定時淡出機制 (3秒)。
 * 4. 記錄系統偏好設定 (公司名稱、自動扣庫存開關、幣別符號)。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useUIStore = defineStore('ui', () => {
    // ===================================================================
    // 1. 全域搜尋狀態
    // ===================================================================
    const globalSearchTerm = ref('');
    // ===================================================================
    // 2. 全域彈窗與抽屜控制變數 (Boolean Flags)
    // ===================================================================
    const isNewItemModalOpen = ref(false); // 快速新增物料彈窗
    const isBarcodeModalOpen = ref(false); // 條碼掃描辨識彈窗
    const isHistoryDrawerOpen = ref(false); // 操作歷程抽屜
    const isSettingsModalOpen = ref(false); // 偏好設定彈窗
    const isHelpModalOpen = ref(false); // 系統說明與支援彈窗
    const isMobileNavOpen = ref(false); // 手機版漢堡選單開關
    // ===================================================================
    // 3. 系統偏好與組態設定
    // ===================================================================
    const companyName = ref('Humanist Coffee Roasters Ltd.');
    const autoDeductBOM = ref(true); // 銷售時是否依 BOM 配方自動扣減原料庫存
    const currencySymbol = ref('USD ($)'); // 貨幣符號
    const lowStockNotice = ref(true); // 低庫存警示開關
    // ===================================================================
    // 4. 全域 Toast 訊息推播系統
    // ===================================================================
    const toastMessage = ref(null);
    const toastType = ref('success');
    /**
     * 顯示全域 Toast 提示訊息 (3秒後自動消退)
     * @param msg 提示文字
     * @param type 訊息等級 ('success' | 'info' | 'warning' | 'error')
     */
    function showToast(msg, type = 'success') {
        toastMessage.value = msg;
        toastType.value = type;
        setTimeout(() => {
            toastMessage.value = null;
        }, 3000);
    }
    /** 更新頂部全域搜尋詞 */
    function setGlobalSearch(term) {
        globalSearchTerm.value = term;
    }
    /** 切換行動裝置側邊導航開啟狀態 */
    function toggleMobileNav() {
        isMobileNavOpen.value = !isMobileNavOpen.value;
    }
    return {
        // 狀態
        globalSearchTerm,
        isNewItemModalOpen,
        isBarcodeModalOpen,
        isHistoryDrawerOpen,
        isSettingsModalOpen,
        isHelpModalOpen,
        isMobileNavOpen,
        companyName,
        autoDeductBOM,
        currencySymbol,
        lowStockNotice,
        toastMessage,
        toastType,
        // 動作函式
        showToast,
        setGlobalSearch,
        toggleMobileNav,
    };
});
