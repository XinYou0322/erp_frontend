<template>
  <div class="space-y-6 pb-12">

    <!-- =========================
         KPI Cards
         ========================= -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      <MetricCard
        title="原物料建檔品項"
        :value="`${materialSummary.totalMaterials} 種`"
        growth="即時資料"
        subtitle="目前系統已建立的原物料主檔"
        :icon="Package"
      />

      <MetricCard
        title="平均原物料成本"
        :value="`NT$ ${Number(materialSummary.averageCost).toFixed(1)}`"
        growth="依目前主檔計算"
        variant="cyan"
        subtitle="所有原物料成本平均值"
        :icon="DollarSign"
      />

      <MetricCard
        title="已設定安全庫存"
        :value="`${materialSummary.safetyStockCount} 項`"
        growth="安全庫存管理"
        variant="emerald"
        subtitle="已有設定安全庫存水位的原物料"
        :icon="ShieldCheck"
      />

      <MetricCard
        title="計量單位種類"
        :value="`${materialSummary.unitCount} 種`"
        growth="主檔規格"
        subtitle="目前使用中的不同計量單位"
        :icon="Scale"
      />

    </div>


    <!-- =========================
         Toolbar
         ========================= -->
    <div
      class="
        p-4
        rounded-2xl
        flex
        flex-col
        sm:flex-row
        sm:items-center
        justify-between
        gap-3
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
      "
    >

      <div>

        <div
          class="
            font-bold
            text-[length:var(--font-heading)]
            text-[var(--on-surface)]
          "
        >
          原物料主檔管理
        </div>

        <div
          class="
            text-[length:var(--font-body)]
            text-[var(--on-surface-variant)]
            mt-1
          "
        >
          管理原物料名稱、料號、單位、成本與安全庫存
        </div>

      </div>


      <div class="flex items-center space-x-2 shrink-0">

        <!-- 重新整理 -->
        <button
          type="button"
          @click="loadMaterials"
          class="
            btn-secondary
            text-[length:var(--font-body)]
            px-3
            py-1.5
          "
        >
          重新整理
        </button>


        <!-- 新增原物料 -->
        <button
          type="button"
          @click="handleOpenAddMaterial"
          class="
            btn-primary
            text-[length:var(--font-body)]
            px-3
            py-1.5
            flex
            items-center
            space-x-1.5
          "
        >
          <Plus class="w-4 h-4" />

          <span>
            新增原物料
          </span>
        </button>

      </div>
    </div>


    <!-- =========================
         Loading
         ========================= -->
    <div
      v-if="loading"
      class="
        rounded-2xl
        p-8
        text-center
        text-[length:var(--font-title)]
        bg-[var(--surface-container)]
        border
        border-[var(--outline)]
        text-[var(--on-surface-variant)]
      "
    >
      正在讀取原物料資料...
    </div>


    <!-- =========================
         Error
         ========================= -->
    <div
      v-else-if="errorMessage"
      class="
        rounded-2xl
        border
        border-[var(--error)]/30
        bg-[var(--error)]/10
        p-4
        text-[length:var(--font-title)]
        text-[var(--error)]
      "
    >
      {{ errorMessage }}
    </div>


    <!-- =========================
         Material Cards
         ========================= -->
    <div
      v-else-if="materials.length > 0"
      class="
        grid
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-3
        gap-5
      "
    >

      <div
        v-for="material in materials"
        :key="material.id"
        :class="material.status === 'INACTIVE' ? 'opacity-45 grayscale' : ''"
        class="
          p-5
          min-h-[220px]
          rounded-2xl
          bg-[var(--surface-container)]
          border
          border-[var(--outline)]
          hover:border-[var(--primary)]/40
          hover:bg-[var(--surface-container-high)]
          transition-all
          shadow-sm
          flex
          flex-col
          justify-between
          space-y-4
          group
        "
      >

        <div>

          <!-- =========================
               Card Header
               ========================= -->
          <div class="flex items-start justify-between">

            <div class="flex items-center space-x-3 min-w-0">

              <div
                class="
                  w-10
                  h-10
                  rounded-xl
                  bg-[var(--primary)]/10
                  border
                  border-[var(--primary)]/25
                  flex
                  items-center
                  justify-center
                  text-[var(--primary)]
                  shrink-0
                "
              >
                <Package class="w-5 h-5" />
              </div>


              <div class="min-w-0">

                <h3
                  class="
                    font-bold
                    text-[length:var(--font-title)]
                    text-[var(--on-surface)]
                    group-hover:text-[var(--primary)]
                    transition-colors
                    truncate
                  "
                >
                  {{ material.name }}
                </h3>


                <div
                  class="
                    text-[length:var(--font-body)]
                    text-[var(--on-surface-variant)]
                    font-data-mono
                    mt-0.5
                  "
                >
                  <span
                    class="
                      text-[var(--primary)]
                      font-semibold
                    "
                  >
                    {{ material.code }}
                  </span>
                </div>

              </div>

            </div>


            <!-- 編輯 -->
            <button
            
              type="button"
              @click="startEditMaterial(material)"
              class="
                px-2.5
                py-1
                rounded-lg
                bg-[var(--primary)]/10
                hover:bg-[var(--primary)]/20
                text-[var(--primary)]
                border
                border-[var(--primary)]/25
                text-[length:var(--font-body)]
                font-bold
                transition-colors
                cursor-pointer
                flex
                items-center
                space-x-1
                shrink-0
              "
            >
              <Edit3 class="w-3.5 h-3.5" />
              <span>編輯</span>
            </button>

          </div>


          <!-- =========================
               Material Info
               ========================= -->

          <!-- 一般顯示模式 -->
          <div
         
            class="
              mt-4
              p-4
              rounded-xl
              bg-[var(--surface-container-low)]
              border
              border-[var(--outline)]
              grid
              grid-cols-3
              gap-2
              text-center
            "
          >

            <!-- 計量單位 -->
            <div>

              <span
                class="
                  text-[length:var(--font-body)]
                  text-[var(--on-surface-variant)]
                  font-semibold
                  block
                  mb-1
                "
              >
                計量單位
              </span>

              <span
                class="
                  font-bold
                  text-[length:var(--font-title)]
                  text-[var(--primary)]
                "
              >
                {{ material.unit }}
              </span>

            </div>


            <!-- 原物料成本 -->
            <div
              class="
                border-x
                border-[var(--outline)]
              "
            >

              <span
                class="
                  text-[length:var(--font-body)]
                  text-[var(--on-surface-variant)]
                  font-semibold
                  block
                  mb-1
                "
              >
                原物料成本
              </span>

              <span
                class="
                  font-bold
                  text-[length:var(--font-title)]
                  text-[var(--primary)]
                "
              >
                NT$ {{ material.cost }}
              </span>

            </div>


            <!-- 安全庫存 -->
            <div>

              <span
                class="
                  text-[length:var(--font-body)]
                  text-[var(--on-surface-variant)]
                  font-semibold
                  block
                  mb-1
                "
              >
                安全庫存
              </span>

              <span
                class="
                  font-bold
                  text-[length:var(--font-title)]
                  text-[var(--primary)]
                "
              >
                {{ material.safetyStock ?? 0 }}
                {{ material.unit }}
              </span>

            </div>

          </div>

<div class="flex justify-center">
          <!-- 停用按鈕：停用後不提供重新啟用 -->
          <button
            v-if="material.status === 'ACTIVE'"
            type="button"
            @click="openDisableConfirm(material)"
            class="
              mt-3 w-1/3 px-3 py-2 rounded-xl border
              text-[length:var(--font-body)] font-bold
              transition-colors cursor-pointer
              bg-[var(--error)]/10
              hover:bg-[var(--error)]/20
              text-[var(--error)]
              border-[var(--error)]/30
            "
          >
            停用原物料
          </button>

          <div
            v-else
            class="
              mt-3 w-full px-3 py-2 rounded-xl border
              text-center text-[length:var(--font-body)] font-bold
              bg-[var(--surface-container-low)]
              text-[var(--on-surface-variant)]
              border-[var(--outline)]
              opacity-60
            "
          >
            已停用
          </div>
</div>

          <!-- =========================
               編輯模式
               ========================= -->

        </div>
      </div>
    </div>


    <!-- =========================
         Pagination
         ========================= -->
    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @change-page="goToPage"
    />

          <EditMaterialModal
  :is-open="editMaterialModalOpen"
  :material="selectedMaterial"
  @close="handleCloseEditMaterial"
  @success="handleEditSuccess"
/>
    <!-- =========================
         Add Material Modal
         ========================= -->
    <AddMaterialModal
      :is-open="addMaterialModalOpen"
      @close="handleCloseAddMaterial"
      @success="handleMaterialSuccess"
    />

    <!-- 停用原物料確認視窗 -->
    <Teleport to="body">
      <div
        v-if="disableConfirmOpen"
        class="
          fixed inset-0 z-[100]
          flex items-center justify-center
          bg-black/60 backdrop-blur-sm
          p-4
        "
        @click.self="closeDisableConfirm"
      >
        <div
          class="
            w-full max-w-md rounded-2xl
            bg-[var(--surface-container)]
            border border-[var(--outline)]
            shadow-2xl p-6
          "
        >
          <h3
            class="
              text-[length:var(--font-heading)]
              font-bold text-[var(--on-surface)]
            "
          >
            確認停用原物料
          </h3>

          <p
            class="
              mt-3 text-[length:var(--font-body)]
              text-[var(--on-surface-variant)]
              leading-6
            "
          >
            確定要停用
            <span class="font-bold text-[var(--on-surface)]">
              {{ materialToDisable?.name }}
            </span>
            嗎？停用後此頁不提供重新啟用功能。
          </p>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="btn-secondary px-4 py-2"
              :disabled="statusUpdatingId !== null"
              @click="closeDisableConfirm"
            >
              取消
            </button>

            <button
              type="button"
              class="
                px-4 py-2 rounded-xl border
                bg-[var(--error)]/10
                hover:bg-[var(--error)]/20
                text-[var(--error)]
                border-[var(--error)]/30
                font-bold transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              :disabled="statusUpdatingId !== null"
              @click="confirmDisableMaterial"
            >
              {{ statusUpdatingId !== null ? '處理中...' : '確認停用' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

import {
  Package,
  DollarSign,
  ShieldCheck,
  Scale,
  Edit3,
  Plus,
} from "lucide-vue-next";
import MetricCard from "@/component/子元件/MetricCard.vue";
import AddMaterialModal from "@/component/父元件/AddMaterialModal.vue";
import Pagination from "@/component/子元件/Pagination.vue";
import httpClient from "@/service/httpClient";
import EditMaterialModal from "@/component/父元件/EditMaterialModal.vue";

// ==============================
// 原物料資料
// ==============================

const materials = ref([]);

const materialSummary = ref({
  totalMaterials: 0,
  averageCost: 0,
  safetyStockCount: 0,
  unitCount: 0
})





const currentPage = ref(1);

// 每頁固定 6 筆
const pageSize = 6;

// 後端告訴我們總共有幾頁
const totalPages = ref(0);

// 後端告訴我們總共有幾筆
const totalElements = ref(0);
// ==============================
// 頁面狀態
// ==============================

const loading = ref(false);

const errorMessage = ref("");

// ==============================
// Modal 狀態
// ==============================

const addMaterialModalOpen = ref(false);


const editMaterialModalOpen = ref(false)
const selectedMaterial = ref(null)

// 正在切換狀態的原物料 ID，避免連續重複點擊
const statusUpdatingId = ref(null)
const disableConfirmOpen = ref(false)
const materialToDisable = ref(null)


// ==============================
// 父元件事件
// 目前只有「編輯」先通知外層
// ==============================

// ==============================
// 打開新增原物料 Modal
// ==============================

const handleOpenAddMaterial = () => {
  console.log("打開新增原物料 Modal");

  addMaterialModalOpen.value = true;
};

// ==============================
// 關閉新增原物料 Modal
// ==============================

const handleCloseAddMaterial = () => {
  addMaterialModalOpen.value = false;
};

// ==============================
// 原物料新增成功
// ==============================

const handleMaterialSuccess = () => {
  console.log("原物料新增成功，重新取得資料");

 loadMaterials();

  loadMaterialSummary();
};


// ==============================
// 取得所有原物料
// ==============================

const loadMaterials = () => {
  loading.value = true;
  errorMessage.value = "";

  httpClient
    .get("/api/material/page", {
      params: {
        page: currentPage.value - 1,
        size: pageSize,
      },
    })

    .then((response) => {
      console.log("後端分頁資料：", response.data);

      totalElements.value = response.data.totalElements;
      // 目前這一頁的 6 筆資料
      materials.value = response.data.content;

      // 總頁數
      totalPages.value = response.data.totalPages;

      // 全部共有幾筆
      totalElements.value = response.data.totalElements;
    })

    .catch((error) => {
      console.error("取得原物料失敗：", error);

      errorMessage.value = "取得原物料資料失敗";
    })

    .finally(() => {
      loading.value = false;
    });
};
const goToPage = (page) => {
  // 防止超出頁數
  if (page < 1 || page > totalPages.value) {
    return;
  }

  // 修改目前頁碼
  currentPage.value = page;

  // 重新向後端取得這一頁
  loadMaterials();
};
// ==============================
// 平均原物料成本
// ==============================
const loadMaterialSummary = () => {

  httpClient
    .get('/api/material/summary')

    .then((response) => {

      materialSummary.value =
        response.data

      console.log(
        '原物料 KPI：',
        materialSummary.value
      )

    })

    .catch((error) => {

      console.error(
        '取得原物料 KPI 失敗：',
        error
      )

    })
}
// ==============================

// ==============================
// 已設定安全庫存數量
// ==============================



const startEditMaterial = (material) => {
  selectedMaterial.value = material
  editMaterialModalOpen.value = true
}

const handleEditSuccess = () => {

  editMaterialModalOpen.value = false
  selectedMaterial.value = null

  loadMaterials();

  loadMaterialSummary();
};


const handleCloseEditMaterial = () => {
  editMaterialModalOpen.value = false
  selectedMaterial.value = null
}



// ==============================
// 停用原物料確認視窗
// ==============================
const openDisableConfirm = (material) => {
  materialToDisable.value = material;
  disableConfirmOpen.value = true;
};

const closeDisableConfirm = () => {
  if (statusUpdatingId.value !== null) return;

  disableConfirmOpen.value = false;
  materialToDisable.value = null;
};

const confirmDisableMaterial = async () => {
  const material = materialToDisable.value;

  if (!material) return;

  statusUpdatingId.value = material.id;
  errorMessage.value = "";

  try {
    await httpClient.patch(
      `/api/material/${material.id}/status`,
      null,
      {
        params: {
          status: "INACTIVE"
        }
      }
    );

    disableConfirmOpen.value = false;
    materialToDisable.value = null;

    await Promise.all([
      loadMaterials(),
      loadMaterialSummary()
    ]);

  } catch (error) {
    console.error("停用原物料失敗：", error);
    errorMessage.value = "停用原物料失敗";
  } finally {
    statusUpdatingId.value = null;
  }
};


// ==============================
// 頁面載入
// ==============================

onMounted(() => {
  loadMaterials();
    loadMaterialSummary();
});
</script>
