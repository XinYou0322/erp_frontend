/**
 * =====================================================================
 * 【本地快取持久化服務 (Local Storage Persistence Service)】: src/services/storage.service.ts
 * =====================================================================
 * 職責說明：
 * 1. 封裝瀏覽器原生 localStorage API，提供型別安全 (Generic Type <T>) 的資料存取。
 * 2. 自動加上系統前綴 `humanist_erp_`，避免與其他應用程式鍵名衝突。
 * 3. 內建 JSON.stringify 與 JSON.parse 序列化處理。
 * 4. 具備完整的 try-catch 例外防護機制（如無痕模式或空間已滿時的安全降級回退）。
 */
export class StorageService {
    /**
     * 讀取本地快取資料
     * @param key 快取鍵名 (不需包含前綴)
     * @param defaultValue 若無快取或讀取失敗時的預設值
     * @returns 解析後之型別化資料或預設值
     */
    static get(key, defaultValue) {
        try {
            const item = localStorage.getItem(`humanist_erp_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        }
        catch (e) {
            console.warn(`[StorageService] 讀取快取失敗 "${key}":`, e);
            return defaultValue;
        }
    }
    /**
     * 寫入或更新本地快取資料
     * @param key 快取鍵名
     * @param value 欲儲存的物件、陣列或數值 (自動轉為 JSON 字串)
     */
    static set(key, value) {
        try {
            localStorage.setItem(`humanist_erp_${key}`, JSON.stringify(value));
        }
        catch (e) {
            console.warn(`[StorageService] 寫入快取失敗 "${key}":`, e);
        }
    }
    /**
     * 刪除指定快取鍵
     * @param key 快取鍵名
     */
    static remove(key) {
        try {
            localStorage.removeItem(`humanist_erp_${key}`);
        }
        catch (e) {
            console.warn(`[StorageService] 刪除快取失敗 "${key}":`, e);
        }
    }
    /**
     * 清除本系統所有相關的快取項目 (以 humanist_erp_ 開頭者)
     */
    static clear() {
        try {
            Object.keys(localStorage)
                .filter((k) => k.startsWith('humanist_erp_'))
                .forEach((k) => localStorage.removeItem(k));
        }
        catch (e) {
            console.warn('[StorageService] 清除所有系統快取失敗:', e);
        }
    }
}
