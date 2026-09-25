<script setup>
import { ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const salesInventorySyncEnabled = ref(false)

function toggleSalesInventorySync() {
  salesInventorySyncEnabled.value = !salesInventorySyncEnabled.value
}
</script>

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
          {{ salesInventorySyncEnabled ? '已開啟' : '已關閉' }}
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
          @click="toggleSalesInventorySync"
        >
          <span class="pos-setting__sync-switch-knob"></span>
        </button>
      </div>
    </article>
  </section>
</template>
