<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { PackageCheck, PackageMinus, Settings, Store } from 'lucide-vue-next'
import BaseBadge from '@/component/子元件/BaseBadge.vue'
import BaseCard from '@/component/子元件/BaseCard.vue'
import { useSystemSettingStore } from '@/stores/systemSetting.store'

const systemSettingStore = useSystemSettingStore()
const {
  purchaseOrderReceivingEnabled,
  retailModeEnabled,
  posAutoMaterialDeductionEnabled,
  errorMessage: storeErrorMessage
} = storeToRefs(systemSettingStore)

const loading = ref(true)
const savingKey = ref('')
const pageErrorMessage = ref('')
const successMessage = ref('')

async function loadSettings() {
  loading.value = true
  pageErrorMessage.value = ''

  const results = await Promise.allSettled([
    systemSettingStore.loadRetailModeSetting(true),
    systemSettingStore.loadReceivingSetting(true),
    systemSettingStore.loadPosDeductionSetting(true)
  ])

  if (results.some((result) => result.status === 'rejected')) {
    pageErrorMessage.value = storeErrorMessage.value || '讀取系統設定失敗'
  }

  loading.value = false
}

async function toggleRetailMode() {
  savingKey.value = 'retail'
  pageErrorMessage.value = ''
  successMessage.value = ''
  try {
    await systemSettingStore.updateRetailModeEnabled(!retailModeEnabled.value)
    successMessage.value = '零售模式已更新'
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '更新零售模式失敗'
  } finally {
    savingKey.value = ''
  }
}

async function toggleReceivingMode() {
  savingKey.value = 'receiving'
  pageErrorMessage.value = ''
  successMessage.value = ''
  try {
    await systemSettingStore.updatePurchaseOrderReceivingEnabled(
      !purchaseOrderReceivingEnabled.value
    )
    successMessage.value = '原物料進料採購模式已更新'
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '更新原物料進料採購模式失敗'
  } finally {
    savingKey.value = ''
  }
}

async function togglePosDeductionMode() {
  savingKey.value = 'pos-deduction'
  pageErrorMessage.value = ''
  successMessage.value = ''
  try {
    await systemSettingStore.updatePosAutoMaterialDeductionEnabled(
      !posAutoMaterialDeductionEnabled.value
    )
    successMessage.value = posAutoMaterialDeductionEnabled.value
      ? '已切換為 POS 結帳自動扣料'
      : '已切換為人員自行領料'
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '更新 POS 扣料模式失敗'
  } finally {
    savingKey.value = ''
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="space-y-6 pb-12">
    <div>
      <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
        <Settings class="h-6 w-6 text-emerald-400" />
        系統設定
      </h2>
      <p class="mt-1 text-xs text-slate-400">
        集中管理會影響商品與原物料流程的全域功能模式。
      </p>
    </div>

    <div
      v-if="loading"
      class="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400"
    >
      正在讀取系統設定...
    </div>

    <template v-else>
      <div
        v-if="pageErrorMessage"
        class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300"
      >
        {{ pageErrorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-300"
      >
        {{ successMessage }}
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BaseCard>
          <template #header>
            <div class="flex w-full items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <Store class="h-5 w-5 text-emerald-400" />
                <span class="text-sm font-bold text-white">零售模式</span>
              </div>
              <BaseBadge :variant="retailModeEnabled ? 'success' : 'neutral'" dot>
                {{ retailModeEnabled ? '已開啟' : '已關閉' }}
              </BaseBadge>
            </div>
          </template>

          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="text-sm font-semibold text-slate-200">商品採單一庫存品模式</p>
              <p class="mt-2 max-w-xl text-xs leading-6 text-slate-400">
                開啟後，新增商品會同步建立一筆原物料與一筆數量為 1 的 BOM。
              </p>
            </div>

            <button
              type="button"
              role="switch"
              :aria-checked="retailModeEnabled"
              :disabled="Boolean(savingKey)"
              class="relative h-8 w-16 shrink-0 rounded-full border transition-colors disabled:cursor-wait disabled:opacity-60"
              :class="retailModeEnabled
                ? 'border-emerald-400 bg-emerald-500'
                : 'border-slate-700 bg-slate-800'"
              @click="toggleRetailMode"
            >
              <span
                class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
                :class="retailModeEnabled ? 'left-9' : 'left-1'"
              />
            </button>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <div class="flex w-full items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <PackageCheck class="h-5 w-5 text-cyan-400" />
                <span class="text-sm font-bold text-white">原物料進料採購模式</span>
              </div>
              <BaseBadge :variant="purchaseOrderReceivingEnabled ? 'success' : 'neutral'" dot>
                {{ purchaseOrderReceivingEnabled ? '已開啟' : '已關閉' }}
              </BaseBadge>
            </div>
          </template>

          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="text-sm font-semibold text-slate-200">進貨時要求選擇採購單</p>
              <p class="mt-2 max-w-xl text-xs leading-6 text-slate-400">
                開啟後，原物料收貨必須從未完成入庫的採購單選擇；關閉後可直接選擇原物料進貨。
              </p>
            </div>

            <button
              type="button"
              role="switch"
              :aria-checked="purchaseOrderReceivingEnabled"
              :disabled="Boolean(savingKey)"
              class="relative h-8 w-16 shrink-0 rounded-full border transition-colors disabled:cursor-wait disabled:opacity-60"
              :class="purchaseOrderReceivingEnabled
                ? 'border-emerald-400 bg-emerald-500'
                : 'border-slate-700 bg-slate-800'"
              @click="toggleReceivingMode"
            >
              <span
                class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
                :class="purchaseOrderReceivingEnabled ? 'left-9' : 'left-1'"
              />
            </button>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <div class="flex w-full items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <PackageMinus class="h-5 w-5 text-amber-400" />
                <span class="text-sm font-bold text-white">原物料扣料模式</span>
              </div>
              <BaseBadge :variant="posAutoMaterialDeductionEnabled ? 'success' : 'neutral'" dot>
                {{ posAutoMaterialDeductionEnabled ? 'POS 自動扣料' : '人員自行領料' }}
              </BaseBadge>
            </div>
          </template>

          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="text-sm font-semibold text-slate-200">
                POS 結帳時依照商品 BOM 扣除原物料
              </p>
              <p class="mt-2 max-w-xl text-xs leading-6 text-slate-400">
                開啟後，POS 完成結帳會自動依 BOM 與銷售數量扣除有效庫存；關閉時維持目前的人員自行領料流程。
              </p>
            </div>

            <button
              type="button"
              role="switch"
              :aria-checked="posAutoMaterialDeductionEnabled"
              :disabled="Boolean(savingKey)"
              class="relative h-8 w-16 shrink-0 rounded-full border transition-colors disabled:cursor-wait disabled:opacity-60"
              :class="posAutoMaterialDeductionEnabled
                ? 'border-emerald-400 bg-emerald-500'
                : 'border-slate-700 bg-slate-800'"
              @click="togglePosDeductionMode"
            >
              <span
                class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
                :class="posAutoMaterialDeductionEnabled ? 'left-9' : 'left-1'"
              />
            </button>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
