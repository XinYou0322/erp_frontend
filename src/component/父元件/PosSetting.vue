<template>
  <section class="pos-setting">
    <article class="pos-setting__sync-card bento-card">
      <header class="pos-setting__sync-header">
        <div class="pos-setting__sync-heading">
          <RefreshCw
            class="pos-setting__sync-icon"
            :size="20"
            :stroke-width="2"
            aria-hidden="true"
          />
          <h2 class="pos-setting__sync-title">銷售與庫存同步</h2>
        </div>

        <span
          class="pos-setting__sync-status"
          :class="{ 'is-enabled': salesInventorySyncEnabled }"
        >
          <span class="pos-setting__sync-status-dot"></span>
          {{ loading ? '讀取中' : (salesInventorySyncEnabled ? '已開啟' : '已關閉') }}
        </span>
      </header>

      <div class="pos-setting__sync-body">
        <div class="pos-setting__sync-copy">
          <h3>銷售完成後同步扣除庫存</h3>
          <p>
            開啟後，POS 完成銷售時會依商品 BOM 用量同步扣除原物料庫存，讓銷售紀錄與即時庫存保持一致。
          </p>
        </div>

        <button
          type="button"
          role="switch"
          class="pos-setting__sync-switch"
          :class="{ 'is-enabled': salesInventorySyncEnabled }"
          :aria-checked="salesInventorySyncEnabled"
          :aria-label="salesInventorySyncEnabled ? '關閉銷售與庫存同步' : '開啟銷售與庫存同步'"
          :disabled="loading || saving"
          @click="toggleSalesInventorySync"
        >
          <span class="pos-setting__sync-switch-knob"></span>
        </button>
      </div>

      <p v-if="pageErrorMessage" class="pos-setting__message is-error">
        {{ pageErrorMessage }}
      </p>
      <p v-else-if="successMessage" class="pos-setting__message is-success">
        {{ successMessage }}
      </p>
    </article>
  </section>
</template>



<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw } from 'lucide-vue-next'
import { useSystemSettingStore } from '@/stores/systemSetting.store'

const systemSettingStore = useSystemSettingStore()
const {
  salesInventorySyncEnabled,
  loading,
  saving,
  errorMessage: storeErrorMessage
} = storeToRefs(systemSettingStore)

const pageErrorMessage = ref('')
const successMessage = ref('')

async function loadSalesInventorySyncSetting() {
  pageErrorMessage.value = ''
  try {
    await systemSettingStore.loadSalesInventorySyncSetting(true)
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '讀取銷售與庫存同步設定失敗'
  }
}

async function toggleSalesInventorySync() {
  if (saving.value) return

  pageErrorMessage.value = ''
  successMessage.value = ''
  try {
    await systemSettingStore.updateSalesInventorySyncEnabled(
      !salesInventorySyncEnabled.value
    )
    successMessage.value = salesInventorySyncEnabled.value
      ? '銷售與庫存同步已開啟'
      : '銷售與庫存同步已關閉'
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '更新銷售與庫存同步設定失敗'
  }
}

onMounted(loadSalesInventorySyncSetting)
</script>


