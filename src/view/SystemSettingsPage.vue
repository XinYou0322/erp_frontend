<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Image, PackageCheck, PackageMinus, RotateCcw, Settings, Store, Upload } from 'lucide-vue-next'
import BaseBadge from '@/component/子元件/BaseBadge.vue'
import BaseCard from '@/component/子元件/BaseCard.vue'
import {
  resolveBackendAssetUrl,
  useSystemSettingStore
} from '@/stores/systemSetting.store'

const systemSettingStore = useSystemSettingStore()
const {
  purchaseOrderReceivingEnabled,
  retailModeEnabled,
  salesInventorySyncEnabled,
  siteName,
  siteLogoUrl,
  errorMessage: storeErrorMessage
} = storeToRefs(systemSettingStore)

const loading = ref(true)
const savingKey = ref('')
const pageErrorMessage = ref('')
const successMessage = ref('')
const siteNameInput = ref('深淵之流')
const selectedLogoFile = ref(null)
const localPreviewUrl = ref('')
const logoInput = ref(null)
const brandingPreviewUrl = computed(() =>
  localPreviewUrl.value || resolveBackendAssetUrl(siteLogoUrl.value)
)

async function loadSettings() {
  loading.value = true
  pageErrorMessage.value = ''

  const results = await Promise.allSettled([
    systemSettingStore.loadRetailModeSetting(true),
    systemSettingStore.loadReceivingSetting(true),
    systemSettingStore.loadSalesInventorySyncSetting(true),
    systemSettingStore.loadBrandingSettings(true)
  ])

  if (results.some((result) => result.status === 'rejected')) {
    pageErrorMessage.value = storeErrorMessage.value || '讀取系統設定失敗'
  }

  siteNameInput.value = siteName.value

  loading.value = false
}

function clearLocalPreview() {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = ''
  }
}

function handleLogoChange(event) {
  const file = event.target.files?.[0]
  pageErrorMessage.value = ''
  successMessage.value = ''

  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'].includes(file.type)) {
    pageErrorMessage.value = '僅支援 PNG、JPG、WebP 或 ICO 圖片'
    event.target.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    pageErrorMessage.value = '圖片大小不得超過 2 MB'
    event.target.value = ''
    return
  }

  clearLocalPreview()
  selectedLogoFile.value = file
  localPreviewUrl.value = URL.createObjectURL(file)
}

async function saveBranding() {
  const normalizedName = siteNameInput.value.trim()
  if (!normalizedName) {
    pageErrorMessage.value = '網站名稱不得為空'
    return
  }

  savingKey.value = 'branding'
  pageErrorMessage.value = ''
  successMessage.value = ''
  try {
    let nextLogoUrl = siteLogoUrl.value
    if (selectedLogoFile.value) {
      nextLogoUrl = await systemSettingStore.uploadSiteLogo(selectedLogoFile.value)
    }
    await systemSettingStore.updateBrandingSettings(normalizedName, nextLogoUrl)
    siteNameInput.value = siteName.value
    selectedLogoFile.value = null
    clearLocalPreview()
    if (logoInput.value) logoInput.value.value = ''
    successMessage.value = '網站名稱與圖示已更新'
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '更新網站外觀設定失敗'
  } finally {
    savingKey.value = ''
  }
}

async function restoreDefaultBranding() {
  savingKey.value = 'branding'
  pageErrorMessage.value = ''
  successMessage.value = ''
  try {
    await systemSettingStore.updateBrandingSettings('深淵之流', '')
    siteNameInput.value = siteName.value
    selectedLogoFile.value = null
    clearLocalPreview()
    if (logoInput.value) logoInput.value.value = ''
    successMessage.value = '已恢復預設網站名稱與圖示'
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '恢復預設外觀失敗'
  } finally {
    savingKey.value = ''
  }
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
    await systemSettingStore.updateSalesInventorySyncEnabled(
      !salesInventorySyncEnabled.value
    )
    successMessage.value = salesInventorySyncEnabled.value
      ? '已切換為 POS 結帳自動扣料'
      : '已切換為人員自行領料'
  } catch (error) {
    pageErrorMessage.value = storeErrorMessage.value || '更新 POS 扣料模式失敗'
  } finally {
    savingKey.value = ''
  }
}

onMounted(loadSettings)
onBeforeUnmount(clearLocalPreview)
</script>

<template>
  <div class="space-y-6 px-6 pt-6 pb-12">
    <div>
      <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--on-surface)]">
        <Settings class="h-6 w-6 text-[var(--primary)]" />
        系統設定
      </h2>
      <p class="mt-1 text-xs text-[var(--on-surface-variant)]">
        集中管理會影響商品與原物料流程的全域功能模式。
      </p>
    </div>

    <div
      v-if="loading"
      class="rounded-2xl border border-[var(--outline)] bg-[var(--surface-container)] p-8 text-center text-sm text-[var(--on-surface-variant)]"
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

      <BaseCard>
        <template #header>
          <div class="flex w-full items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <Image class="h-5 w-5 text-violet-400" />
              <span class="text-sm font-bold text-[var(--on-surface)]">網站外觀</span>
            </div>
            <BaseBadge variant="neutral">側邊欄與瀏覽器頁籤</BaseBadge>
          </div>
        </template>

        <div class="grid gap-6 lg:grid-cols-[1fr_220px]">
          <div class="space-y-5">
            <label class="block">
              <span class="mb-2 block text-xs font-bold text-[var(--on-surface)]">網站名稱</span>
              <input
                v-model="siteNameInput"
                type="text"
                maxlength="30"
                :disabled="savingKey === 'branding'"
                class="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-60"
                placeholder="請輸入網站名稱"
              />
              <span class="mt-1 block text-right text-[10px] text-[var(--on-surface-variant)]">
                {{ siteNameInput.length }}/30
              </span>
            </label>

            <div>
              <span class="mb-2 block text-xs font-bold text-[var(--on-surface)]">網站圖示</span>
              <input
                ref="logoInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/x-icon,.ico"
                class="hidden"
                @change="handleLogoChange"
              />
              <div class="flex flex-wrap gap-3">
                <button
                  type="button"
                  :disabled="savingKey === 'branding'"
                  class="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs disabled:cursor-wait disabled:opacity-60"
                  @click="logoInput?.click()"
                >
                  <Upload class="h-4 w-4" />
                  選擇圖片
                </button>
                <button
                  type="button"
                  :disabled="Boolean(savingKey)"
                  class="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs disabled:cursor-wait disabled:opacity-60"
                  @click="saveBranding"
                >
                  {{ savingKey === 'branding' ? '儲存中...' : '儲存外觀' }}
                </button>
                <button
                  type="button"
                  :disabled="Boolean(savingKey)"
                  class="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs disabled:cursor-wait disabled:opacity-60"
                  @click="restoreDefaultBranding"
                >
                  <RotateCcw class="h-4 w-4" />
                  恢復預設
                </button>
              </div>
              <p class="mt-3 text-[11px] leading-5 text-[var(--on-surface-variant)]">
                支援 PNG、JPG、WebP、ICO，最大 2 MB。建議使用正方形圖片，將同步顯示於側邊欄與瀏覽器圖示。
              </p>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--outline)] bg-[var(--surface-container-low)] p-5">
            <div class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl">
              <img
                v-if="brandingPreviewUrl"
                :src="brandingPreviewUrl"
                alt="網站圖示預覽"
                class="h-full w-full object-contain"
              />
              <Store v-else class="h-11 w-11 text-[var(--primary)]" />
            </div>
            <p class="mt-4 max-w-full truncate text-sm font-black text-[var(--on-surface)]">
              {{ siteNameInput || '網站名稱' }}
            </p>
            <p class="mt-1 text-[10px] font-semibold tracking-widest text-[var(--secondary)]">
              BEVERAGE CONTROL
            </p>
          </div>
        </div>
      </BaseCard>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BaseCard>
          <template #header>
            <div class="flex w-full items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <Store class="h-5 w-5 text-[var(--primary)]" />
                <span class="text-sm font-bold text-[var(--on-surface)]">零售模式</span>
              </div>
              <BaseBadge :variant="retailModeEnabled ? 'success' : 'neutral'" dot>
                {{ retailModeEnabled ? '已開啟' : '已關閉' }}
              </BaseBadge>
            </div>
          </template>

          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="text-sm font-semibold text-[var(--on-surface)]">商品採單一庫存品模式</p>
              <p class="mt-2 max-w-xl text-xs leading-6 text-[var(--on-surface-variant)]">
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
                ? 'border-[var(--primary)] bg-[var(--primary)]'
                : 'border-[var(--outline)] bg-[var(--surface-container-high)]'"
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
                <PackageCheck class="h-5 w-5 text-[var(--secondary)]" />
                <span class="text-sm font-bold text-[var(--on-surface)]">原物料進料採購模式</span>
              </div>
              <BaseBadge :variant="purchaseOrderReceivingEnabled ? 'success' : 'neutral'" dot>
                {{ purchaseOrderReceivingEnabled ? '已開啟' : '已關閉' }}
              </BaseBadge>
            </div>
          </template>

          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="text-sm font-semibold text-[var(--on-surface)]">進貨時要求選擇採購單</p>
              <p class="mt-2 max-w-xl text-xs leading-6 text-[var(--on-surface-variant)]">
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
                ? 'border-[var(--primary)] bg-[var(--primary)]'
                : 'border-[var(--outline)] bg-[var(--surface-container-high)]'"
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
                <PackageMinus class="h-5 w-5 text-[var(--tertiary)]" />
                <span class="text-sm font-bold text-[var(--on-surface)]">原物料扣料模式</span>
              </div>
              <BaseBadge :variant="salesInventorySyncEnabled ? 'success' : 'neutral'" dot>
                {{ salesInventorySyncEnabled ? 'POS 自動扣料' : '人員自行領料' }}
              </BaseBadge>
            </div>
          </template>

          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="text-sm font-semibold text-[var(--on-surface)]">
                POS 結帳時依照商品 BOM 扣除原物料
              </p>
              <p class="mt-2 max-w-xl text-xs leading-6 text-[var(--on-surface-variant)]">
                開啟後，POS 完成結帳會自動依 BOM 與銷售數量扣除有效庫存；關閉時維持目前的人員自行領料流程。
              </p>
            </div>

            <button
              type="button"
              role="switch"
              :aria-checked="salesInventorySyncEnabled"
              :disabled="Boolean(savingKey)"
              class="relative h-8 w-16 shrink-0 rounded-full border transition-colors disabled:cursor-wait disabled:opacity-60"
              :class="salesInventorySyncEnabled
                ? 'border-[var(--primary)] bg-[var(--primary)]'
                : 'border-[var(--outline)] bg-[var(--surface-container-high)]'"
              @click="togglePosDeductionMode"
            >
              <span
                class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
                :class="salesInventorySyncEnabled ? 'left-9' : 'left-1'"
              />
            </button>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
