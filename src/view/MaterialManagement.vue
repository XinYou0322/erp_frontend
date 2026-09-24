<template>



  <!-- =========================
         Loading
         ========================= -->
  <div
    v-if="loading"
    class="rounded-2xl p-8 text-center text-[length:var(--font-title)] bg-[var(--surface-container)] border border-[var(--outline)] text-[var(--on-surface-variant)]"
  >
    正在讀取原物料資料...
  </div>

  <!-- =========================
         Error
         ========================= -->
  <div
    v-else-if="errorMessage"
    class="rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/10 p-4 text-[length:var(--font-title)] text-[var(--error)]"
  >
    {{ errorMessage }}
  </div>

  <!-- =========================
         Material Cards
         ========================= -->
  <div
    v-else-if="materials.length > 0"
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
  >
    <div
      v-for="material in materials"
      :key="material.id"
      :class="material.status === 'INACTIVE' ? 'opacity-45 grayscale' : ''"
      class="p-5 min-h-[220px] rounded-2xl bg-[var(--surface-container)] border border-[var(--outline)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-container-high)] transition-all shadow-sm flex flex-col justify-between space-y-4 group"
    >
      <div>
        <!-- =========================
               Card Header
               ========================= -->
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3 min-w-0">
            <div
              class="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/25 flex items-center justify-center text-[var(--primary)] shrink-0"
            >
              <Package class="w-5 h-5" />
            </div>

            <div class="min-w-0">
              <h3
                class="font-bold text-[length:var(--font-title)] text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors truncate"
              >
                {{ material.name }}
              </h3>

              <div
                class="text-[length:var(--font-body)] text-[var(--on-surface-variant)] font-data-mono mt-0.5"
              >
                <span class="text-[var(--primary)] font-semibold">
                  {{ material.code }}
                </span>
              </div>
            </div>
          </div>

          <!-- 編輯 -->
          <button
            type="button"
            @click="startEditMaterial(material)"
            class="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/25 text-[length:var(--font-body)] font-bold transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
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
          class="mt-4 p-4 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline)] grid grid-cols-3 gap-2 text-center"
        >
          <!-- 計量單位 -->
          <div>
            <span
              class="text-[length:var(--font-body)] text-[var(--on-surface-variant)] font-semibold block mb-1"
            >
              計量單位
            </span>

            <span
              class="font-bold text-[length:var(--font-title)] text-[var(--primary)]"
            >
              {{ material.unit }}
            </span>
          </div>

          <!-- 原物料成本 -->
          <div class="border-x border-[var(--outline)]">
            <span
              class="text-[length:var(--font-body)] text-[var(--on-surface-variant)] font-semibold block mb-1"
            >
              原物料成本
            </span>

            <span
              class="font-bold text-[length:var(--font-title)] text-[var(--primary)]"
            >
              NT$ {{ material.cost }}
            </span>
          </div>

          <!-- 安全庫存 -->
          <div>
            <span
              class="text-[length:var(--font-body)] text-[var(--on-surface-variant)] font-semibold block mb-1"
            >
              安全庫存
            </span>

            <span
              class="font-bold text-[length:var(--font-title)] text-[var(--primary)]"
            >
              {{ material.safetyStock ?? 0 }}
              {{ material.unit }}
            </span>
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
    @disabled="handleMaterialDisabled"
  />
  <!-- =========================
         Add Material Modal
         ========================= -->
  <AddMaterialModal
    :is-open="addMaterialModalOpen"
    @close="handleCloseAddMaterial"
    @success="handleMaterialSuccess"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"; // ✨ 新增：引入 watch
import { useRoute } from "vue-router"; // ✨ 新增：引入 useRoute

import {
  Package,
  DollarSign,
  ShieldCheck,
  Scale,
  Edit3,
} from "lucide-vue-next";
import MetricCard from "@/component/子元件/MetricCard.vue";
import AddMaterialModal from "@/component/父元件/AddMaterialModal.vue";
import Pagination from "@/component/子元件/Pagination.vue";
import httpClient from "@/service/httpClient";
import EditMaterialModal from "@/component/父元件/EditMaterialModal.vue";

// ✨ 新增：宣告路由實例
const route = useRoute();

// ==============================
// 原物料資料
// ==============================

const rawMaterials = ref([]);
const searchQuery = ref(""); // ✨ 確保搜尋變數與通知抽屜同步

const materialSummary = ref({
  totalMaterials: 0,
  averageCost: 0,
  safetyStockCount: 0,
  unitCount: 0,
});

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

const editMaterialModalOpen = ref(false);
const selectedMaterial = ref(null);

// ✨ 核心升級：前端即時響應式過濾，完美解構「黑糖珍珠」、「仙草凍」等跳轉關鍵字
const materials = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) return rawMaterials.value;

  return rawMaterials.value.filter(
    (m) =>
      String(m.name || "")
        .toLowerCase()
        .includes(keyword) ||
      String(m.code || "")
        .toLowerCase()
        .includes(keyword),
  );
});

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

  // 📥 動態組裝參數，如果網頁網址有 ?search=黑糖珍珠，就把它帶給後端
  const params = {
    page: currentPage.value - 1,
    size: pageSize,
  };

  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim(); // 假設你後端分頁 API 支援 search 欄位過濾
  }

  httpClient
    .get("/api/material/page", {
      params: {
        page: currentPage.value - 1,
        size: pageSize,
      },
    })
    .then((response) => {
      // 🛡️ 安全防禦：確認有拿到資料才解構，完美消滅 Cannot read properties of undefined 錯誤
      if (response && response.data) {
        console.log("後端分頁資料成功讀取：", response.data);
        totalElements.value = response.data.totalElements || 0;
        rawMaterials.value = response.data.content || [];
        totalPages.value = response.data.totalPages || 0;
      } else {
        throw new Error("後端回傳格式不正確");
      }
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
    .get("/api/material/summary")

    .then((response) => {
      materialSummary.value = response.data;

      console.log("原物料 KPI：", materialSummary.value);
    })

    .catch((error) => {
      console.error("取得原物料 KPI 失敗：", error);
    });
};
// ==============================

// ==============================
// 已設定安全庫存數量
// ==============================

const startEditMaterial = (material) => {
  selectedMaterial.value = material;
  editMaterialModalOpen.value = true;
};

const handleEditSuccess = () => {
  editMaterialModalOpen.value = false;
  selectedMaterial.value = null;

  loadMaterials();

  loadMaterialSummary();
};

const handleCloseEditMaterial = () => {
  editMaterialModalOpen.value = false;
  selectedMaterial.value = null;
};

const handleMaterialDisabled = async () => {
  await Promise.all([
    loadMaterials(),
    loadMaterialSummary()
  ])
}

const refresh = () => {
  loadMaterials();
  loadMaterialSummary();
};

defineExpose({
  refresh,
  openPrimaryAction: handleOpenAddMaterial,
});




// ==============================
// 頁面載入
// ==============================

onMounted(() => {
  // 🔍 檢查是否有從通知抽屜傳過來的搜尋關鍵字
  if (route.query.search) {
    searchQuery.value = route.query.search;
  }

  loadMaterials();
  loadMaterialSummary();
});

// ✨ 新增：監聽路由，當使用者打開通知中心點擊另一個物料時，不用重新整理就能直接切換過濾
watch(
  () => route.query.search,
  (newSearch) => {
    searchQuery.value = newSearch || "";
  },
);
</script>
