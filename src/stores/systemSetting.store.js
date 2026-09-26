import { defineStore } from "pinia";
import { ref } from "vue";
import httpClient from "@/service/httpClient";

const RECEIVING_SETTING_KEY = "PURCHASE_ORDER_RECEIVING_ENABLED";
const RETAIL_MODE_SETTING_KEY = "RETAIL_MODE_ENABLED";
const SITE_NAME_SETTING_KEY = "SITE_NAME";
const SITE_LOGO_SETTING_KEY = "SITE_LOGO_URL";
const DEFAULT_SITE_NAME = "深淵之流";
const SALES_INVENTORY_SYNC_SETTING_KEY = "SALES_INVENTORY_SYNC_ENABLED";

export const useSystemSettingStore = defineStore("systemSetting", () => {
  const purchaseOrderReceivingEnabled = ref(false);
  const retailModeEnabled = ref(false);
  const siteName = ref(DEFAULT_SITE_NAME);
  const siteLogoUrl = ref("");
  const salesInventorySyncEnabled = ref(false);
  const loaded = ref(false);
  const retailModeLoaded = ref(false);
  const brandingLoaded = ref(false);
  const salesInventorySyncLoaded = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const errorMessage = ref("");

  async function loadReceivingSetting(force = false) {
    if (loaded.value && !force) {
      return purchaseOrderReceivingEnabled.value;
    }

    loading.value = true;
    errorMessage.value = "";
    try {
      const response = await httpClient.get(
        `/api/system-settings/${RECEIVING_SETTING_KEY}`,
      );
      purchaseOrderReceivingEnabled.value =
        String(response.data?.value).toLowerCase() === "true";
      loaded.value = true;
      return purchaseOrderReceivingEnabled.value;
    } catch (error) {
      errorMessage.value = getApiError(error, "讀取進料模式失敗");
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updatePurchaseOrderReceivingEnabled(enabled) {
    saving.value = true;
    errorMessage.value = "";
    try {
      const response = await httpClient.put(
        `/api/system-settings/${RECEIVING_SETTING_KEY}`,
        { value: String(Boolean(enabled)) },
      );
      purchaseOrderReceivingEnabled.value =
        String(response.data?.value).toLowerCase() === "true";
      loaded.value = true;
      return purchaseOrderReceivingEnabled.value;
    } catch (error) {
      errorMessage.value = getApiError(error, "更新進料模式失敗");
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function loadRetailModeSetting(force = false) {
    if (retailModeLoaded.value && !force) {
      return retailModeEnabled.value;
    }

    loading.value = true;
    errorMessage.value = "";
    try {
      const response = await httpClient.get(
        `/api/system-settings/${RETAIL_MODE_SETTING_KEY}`,
      );
      retailModeEnabled.value =
        String(response.data?.value).toLowerCase() === "true";
      retailModeLoaded.value = true;

      return retailModeEnabled.value;
    } catch (error) {
      errorMessage.value = getApiError(error, "讀取零售模式失敗");
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateRetailModeEnabled(enabled) {
    saving.value = true;
    errorMessage.value = "";
    try {
      const response = await httpClient.put(
        `/api/system-settings/${RETAIL_MODE_SETTING_KEY}`,
        { value: String(Boolean(enabled)) },
      );
      retailModeEnabled.value =
        String(response.data?.value).toLowerCase() === "true";
      retailModeLoaded.value = true;

      // 【本次新增：零售模式連動銷售與庫存同步】
      // 後端會在開啟零售模式時一併開啟同步設定；此處立即更新前端狀態，
      // 讓使用者進入 POS 設定時不需重新整理即可看到「已開啟」。
      if (retailModeEnabled.value) {
        salesInventorySyncEnabled.value = true;
        salesInventorySyncLoaded.value = true;
      }

      return retailModeEnabled.value;
    } catch (error) {
      errorMessage.value = getApiError(error, "更新零售模式失敗");
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function loadBrandingSettings(force = false) {
    if (brandingLoaded.value && !force) {
      return { siteName: siteName.value, siteLogoUrl: siteLogoUrl.value };
    }

    loading.value = true;
    errorMessage.value = "";
    try {
      const [nameResponse, logoResponse] = await Promise.all([
        httpClient.get(`/api/system-settings/${SITE_NAME_SETTING_KEY}`),
        httpClient.get(`/api/system-settings/${SITE_LOGO_SETTING_KEY}`),
      ]);
      siteName.value = String(nameResponse.data?.value || DEFAULT_SITE_NAME).trim();
      siteLogoUrl.value = String(logoResponse.data?.value || "").trim();
      brandingLoaded.value = true;
      return { siteName: siteName.value, siteLogoUrl: siteLogoUrl.value };
    } catch (error) {
      errorMessage.value = getApiError(error, "讀取網站外觀設定失敗");
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function uploadSiteLogo(file) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await httpClient.post(
        "/api/system-settings/branding/logo",
        formData,
      );
      return String(response.data?.imageUrl || "");
    } catch (error) {
      errorMessage.value = getApiError(error, "網站圖示上傳失敗");
      throw error;
    }
  }

  async function updateBrandingSettings(name, logoUrl) {
    saving.value = true;
    errorMessage.value = "";
    try {
      const normalizedName = String(name || "").trim();
      const normalizedLogoUrl = String(logoUrl || "").trim();
      const [nameResponse, logoResponse] = await Promise.all([
        httpClient.put(`/api/system-settings/${SITE_NAME_SETTING_KEY}`, {
          value: normalizedName,
        }),
        httpClient.put(`/api/system-settings/${SITE_LOGO_SETTING_KEY}`, {
          value: normalizedLogoUrl,
        }),
      ]);
      siteName.value = String(nameResponse.data?.value || DEFAULT_SITE_NAME);
      siteLogoUrl.value = String(logoResponse.data?.value || "");
      brandingLoaded.value = true;
      return { siteName: siteName.value, siteLogoUrl: siteLogoUrl.value };
    } catch (error) {
      errorMessage.value = getApiError(error, "更新網站外觀設定失敗");
      throw error;
    } finally {
      saving.value = false;
    }
  }

  async function loadSalesInventorySyncSetting(force = false) {
    if (salesInventorySyncLoaded.value && !force) {
      return salesInventorySyncEnabled.value;
    }

    loading.value = true;
    errorMessage.value = "";
    try {
      const response = await httpClient.get(
        `/api/system-settings/${SALES_INVENTORY_SYNC_SETTING_KEY}`,
      );
      salesInventorySyncEnabled.value =
        String(response.data?.value).toLowerCase() === "true";
      salesInventorySyncLoaded.value = true;
      return salesInventorySyncEnabled.value;
    } catch (error) {
      errorMessage.value = getApiError(error, "讀取銷售與庫存同步設定失敗");
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateSalesInventorySyncEnabled(enabled) {
    saving.value = true;
    errorMessage.value = "";
    try {
      const response = await httpClient.put(
        `/api/system-settings/${SALES_INVENTORY_SYNC_SETTING_KEY}`,
        { value: String(Boolean(enabled)) },
      );
      salesInventorySyncEnabled.value =
        String(response.data?.value).toLowerCase() === "true";
      salesInventorySyncLoaded.value = true;
      return salesInventorySyncEnabled.value;
    } catch (error) {
      errorMessage.value = getApiError(error, "更新銷售與庫存同步設定失敗");
      throw error;
    } finally {
      saving.value = false;
    }
  }

  return {
    purchaseOrderReceivingEnabled,
    retailModeEnabled,
    siteName,
    siteLogoUrl,
    salesInventorySyncEnabled,
    loaded,
    loading,
    saving,
    errorMessage,
    brandingLoaded,
    loadReceivingSetting,
    updatePurchaseOrderReceivingEnabled,
    loadRetailModeSetting,
    updateRetailModeEnabled,
    loadBrandingSettings,
    uploadSiteLogo,
    updateBrandingSettings,
    loadSalesInventorySyncSetting,
    updateSalesInventorySyncEnabled,
  };
});

export function resolveBackendAssetUrl(path) {
  if (!path || path.startsWith("blob:") || /^https?:\/\//i.test(path)) {
    return path || "";
  }
  const baseUrl = (import.meta.env.VITE_AXIOS_HTTP_BASEURL || "").replace(/\/+$/, "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function getApiError(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.detail ||
    (typeof error.response?.data === "string" ? error.response.data : "") ||
    fallback
  );
}

