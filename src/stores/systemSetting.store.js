import { defineStore } from "pinia";
import { ref } from "vue";
import httpClient from "@/service/httpClient";

const RECEIVING_SETTING_KEY = "PURCHASE_ORDER_RECEIVING_ENABLED";

export const useSystemSettingStore = defineStore("systemSetting", () => {
  const purchaseOrderReceivingEnabled = ref(false);
  const loaded = ref(false);
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

  return {
    purchaseOrderReceivingEnabled,
    loaded,
    loading,
    saving,
    errorMessage,
    loadReceivingSetting,
    updatePurchaseOrderReceivingEnabled,
  };
});

function getApiError(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.detail ||
    (typeof error.response?.data === "string" ? error.response.data : "") ||
    fallback
  );
}
