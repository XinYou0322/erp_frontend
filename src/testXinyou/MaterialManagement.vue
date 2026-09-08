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
      class="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div>
        <div class="font-bold text-sm text-gray-800">原物料主檔管理</div>

        <div class="text-xs text-gray-400 mt-1">
          管理原物料名稱、料號、單位、成本與安全庫存
        </div>
      </div>

      <div class="flex items-center space-x-2 shrink-0">
        <!-- 重新整理 -->
        <button
          type="button"
          @click="loadMaterials"
          class="btn-secondary text-xs px-3 py-1.5"
        >
          重新整理
        </button>

        <!-- 新增原物料 -->
        <button
          type="button"
          @click="handleOpenAddMaterial"
          class="btn-primary text-xs px-3 py-1.5 flex items-center space-x-1.5"
        >
          <Plus class="w-4 h-4" />

          <span> 新增原物料 </span>
        </button>
      </div>
    </div>

    <!-- =========================
         Loading
         ========================= -->
    <div
      v-if="loading"
      class="glass-panel rounded-2xl p-8 text-center text-sm text-gray-500"
    >
      正在讀取原物料資料...
    </div>

    <!-- =========================
         Error
         ========================= -->
    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
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
        class="glass-panel p-5 min-h-[220px] rounded-2xl border border-white/80 hover:border-[#0070ea]/60 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
      >
        <div>
          <!-- =========================
               Card Header
               ========================= -->
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-[#0070ea] shrink-0"
              >
                <Package class="w-5 h-5" />
              </div>

              <div class="min-w-0">
                <h3
                  class="font-bold text-sm text-[#181c23] group-hover:text-[#0070ea] transition-colors truncate"
                >
                  {{ material.name }}
                </h3>

                <div class="text-[11px] text-gray-400 font-mono mt-0.5">
                  <span class="text-[#0059bb] font-semibold">
                    {{ material.code }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 編輯 -->
           <button 
  v-if="editingMaterialId !== material.id"
  type="button" 
  @click="startEditMaterial(material)" 
  class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0059bb] text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
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
  v-if="editingMaterialId !== material.id"
  class="mt-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100 grid grid-cols-3 gap-2 text-center"
>

  <!-- 計量單位 -->
  <div>
    <span class="text-xs text-gray-900 font-semibold block mb-1">
      計量單位
    </span>

    <span class="font-bold text-base text-[#0059bb]">
      {{ material.unit }}
    </span>
  </div>


  <!-- 原物料成本 -->
  <div class="border-x border-gray-200">
    <span class="text-xs text-gray-900 font-semibold block mb-1">
      原物料成本
    </span>

    <span class="font-bold text-base text-[#0059bb]">
      NT$ {{ material.cost }}
    </span>
  </div>


  <!-- 安全庫存 -->
  <div>
    <span class="text-xs text-gray-900 font-semibold block mb-1">
      安全庫存
    </span>

    <span class="font-bold text-base text-[#0059bb]">
      {{ material.safetyStock ?? 0 }}
      {{ material.unit }}
    </span>
  </div>

</div>
          <!-- 編輯模式 -->
<div
  v-else
  class="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3"
>

  <!-- 名稱 -->
  <div>
    <label class="block text-xs font-bold text-gray-600 mb-1">
      原物料名稱
    </label>

    <input
      v-model="editForm.name"
      type="text"
      class="input-field"
    />
  </div>


  <!-- 代碼 -->
  <div>
    <label class="block text-xs font-bold text-gray-600 mb-1">
      物料代碼
    </label>

    <input
      v-model="editForm.code"
      type="text"
      class="input-field font-mono"
    />
  </div>


  <!-- 單位 / 成本 / 安全庫存 -->
  <div class="grid grid-cols-3 gap-3">

    <div>
      <label class="block text-xs font-bold text-gray-600 mb-1">
        單位
      </label>

      <select
        v-model="editForm.unit"
        class="input-field"
      >
        <option value="kg">公斤 (kg)</option>
        <option value="g">公克 (g)</option>
        <option value="L">公升 (L)</option>
        <option value="ml">毫升 (ml)</option>
        <option value="個">個</option>
        <option value="箱">箱</option>
      </select>
    </div>


    <div>
      <label class="block text-xs font-bold text-gray-600 mb-1">
        成本
      </label>

      <input
        v-model.number="editForm.cost"
        type="number"
        min="0"
        step="any"
        class="input-field no-number-spinner"
      />
    </div>


    <div>
      <label class="block text-xs font-bold text-gray-600 mb-1">
        安全庫存
      </label>

      <input
        v-model.number="editForm.safetyStock"
        type="number"
        min="0"
        step="any"
        class="input-field no-number-spinner"
      />
    </div>

  </div>


  <!-- 操作按鈕 -->
  <div class="flex justify-end gap-2 pt-2">

    <button
      type="button"
      @click="cancelEditMaterial"
      class="btn-secondary text-xs"
    >
      取消
    </button>

  <button
  type="button"
  @click="saveEditMaterial"
  class="btn-primary text-xs"
>
  儲存修改
</button>

  </div>

</div>
        </div>

        <!-- =========================
             Footer
             ========================= -->
        <div
          class="pt-3 border-t border-gray-100/80 text-[11px] text-gray-500 flex items-center justify-between"
        >
          <span> Material ID：{{ material.id }} </span>

          <span
            class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold"
          >
            原物料主檔
          </span>
        </div>
      </div>
    </div>

    <!-- =========================
     Pagination
     ========================= -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-center gap-2 mt-6"
    >
      <!-- 上一頁 -->
      <button
        type="button"
        class="btn-secondary text-xs"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        上一頁
      </button>

      <!-- 頁碼 -->
      <button
        v-for="page in totalPages"
        :key="page"
        type="button"
        @click="goToPage(page)"
        class="px-3 py-2 rounded-lg text-xs font-bold transition"
        :class="currentPage === page ? 'btn-primary' : 'btn-secondary'"
      >
        {{ page }}
      </button>

      <!-- 下一頁 -->
      <button
        type="button"
        class="btn-secondary text-xs"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        下一頁
      </button>
    </div>
    <!-- =========================
         Empty
         ========================= -->
    <div
      v-else
      class="glass-panel rounded-2xl p-10 text-center text-sm text-gray-400"
    >
      目前沒有原物料資料
    </div>

    <!-- =========================
         Add Material Modal
         ========================= -->
    <AddMaterialModal
      :is-open="addMaterialModalOpen"
      @close="handleCloseAddMaterial"
      @success="handleMaterialSuccess"
    />
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
import MetricCard from './components/common/MetricCard.vue'
import AddMaterialModal from "./components/modals/AddMaterialModal.vue";

import httpClient from "@/service/httpClient";

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


const editingMaterialId = ref(null)


// 編輯中的暫存資料
const editForm = ref({
  id: null,
  code: '',
  name: '',
  unit: '',
  cost: 0,
  safetyStock: 0
})


// ==============================
// 父元件事件
// 目前只有「編輯」先通知外層
// ==============================

const emit = defineEmits(["openEditMaterial"]);

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
// 編輯原物料
// ==============================

const handleEditMaterial = (material) => {
  console.log("準備編輯原物料：", material);

  emit("openEditMaterial", material);
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
// 編輯後儲存
// ==============================

const saveEditMaterial = () => {

  const id = editForm.value.id

  const data = {
    code: editForm.value.code.trim(),
    name: editForm.value.name.trim(),
    unit: editForm.value.unit,
    cost: Number(editForm.value.cost),
    safetyStock: Number(editForm.value.safetyStock)
  }

  console.log('準備修改原物料：', data)

  httpClient
    .put(`/api/materialupdate/${id}`, data)

    .then((response) => {

      console.log(
        '修改原物料成功：',
        response.data
      )

      // 退出編輯模式
      editingMaterialId.value = null

      // 重新取得目前頁面的資料
      loadMaterials()

      // KPI 也可能因成本、安全庫存、單位改變
      loadMaterialSummary()

    })

    .catch((error) => {

      console.error(
        '修改原物料失敗：',
        error
      )

    })
}

// ==============================
// 已設定安全庫存數量
// ==============================



const startEditMaterial = (material) => {

  editingMaterialId.value = material.id

  editForm.value = {
    id: material.id,
    code: material.code,
    name: material.name,
    unit: material.unit,
    cost: Number(material.cost),
    safetyStock: Number(material.safetyStock)
  }

}


const cancelEditMaterial = () => {

  editingMaterialId.value = null

}




// ==============================
// 頁面載入
// ==============================

onMounted(() => {
  loadMaterials();
    loadMaterialSummary();
});
</script>
