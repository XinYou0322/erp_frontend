<template>

  <ModalWrapper
    :is-open="isOpen"
    title="編輯原物料"
    subtitle="修改原物料主檔資料"
    max-width="xl"
    :icon="PackagePlus"
    @close="emit('close')"
  >

    <!-- =========================
         編輯原物料表單
         ========================= -->
    <form
      id="edit-material-form"
      @submit.prevent="saveMaterial"
      class="space-y-4"
    >

      <!-- =========================
           名稱 / 代碼
           ========================= -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- 原物料名稱 -->
        <div>

          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            原物料名稱
            <span class="text-[var(--error)]">*</span>
          </label>

          <input
            v-model="name"
            type="text"
            required
            class="input-field"
            placeholder="例如：阿薩姆紅茶原葉"
          />

        </div>


        <!-- 物料代碼 -->
        <div>

          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            物料代碼
            <span class="text-[var(--error)]">*</span>
          </label>

          <!--
            目前物料代碼不允許修改
            因此只顯示原本的 code
          -->
          <input
            :value="code"
            type="text"
            disabled
            class="
              input-field
              font-mono
              opacity-60
              cursor-not-allowed
            "
          />

        </div>

      </div>


      <!-- =========================
           成本模式 / BOM 基本單位
           ========================= -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- 成本模式 -->
        <div>

          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            成本模式
            <span class="text-[var(--error)]">*</span>
          </label>

          <select
            v-model="costMode"
            required
            class="input-field"
          >
            <option value="DIRECT">
              直接輸入
            </option>

            <option value="CONVERSION">
              採購換算
            </option>
          </select>

        </div>


        <!-- 基本單位 -->
        <div>

          <label
            class="
              block
              font-bold
              text-[var(--on-surface)]
              text-xs
              mb-1
            "
          >
            BOM 單位
            <span class="text-[var(--error)]">*</span>
          </label>

          <select
            v-model="unit"
            required
            class="input-field"
          >
            <option value="kg">公斤 (kg)</option>
            <option value="g">公克 (g)</option>
            <option value="L">公升 (L)</option>
            <option value="ml">毫升 (ml)</option>
            <option value="瓶">瓶</option>
            <option value="包">包</option>
            <option value="桶">桶</option>
            <option value="個">個</option>
            <option value="箱">箱</option>
            <option value="支">支</option>
          </select>

        </div>

      </div>


      <!-- =========================
           庫存基準與成本
           ========================= -->
      <div
        class="
          p-3.5
          rounded-xl
          bg-[var(--surface-container-high)]
          border
          border-[var(--outline)]
          space-y-3
        "
      >

        <!-- 標題 -->
        <div
          class="
            flex
            items-center
            space-x-1.5
            text-xs
            font-bold
            text-[var(--primary)]
          "
        >
          <Layers class="w-4 h-4" />

          <span>
            庫存基準與成本
          </span>
        </div>


        <!-- =========================
             安全庫存 + DIRECT / 採購單位
             ========================= -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <!-- 安全庫存 -->
          <div>

            <label
              class="
                block
                font-semibold
                text-[var(--on-surface-variant)]
                text-xs
                mb-1
              "
            >
              安全庫存
            </label>

            <div class="relative">

              <input
                v-model.number="safetyStock"
                type="number"
                step="any"
                min="0"
                required
                class="
                  input-field
                  no-number-spinner
                  pr-12
                "
              />

              <span
                class="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-[var(--on-surface-variant)]
                  text-xs
                "
              >
                {{ unit }}
              </span>

            </div>

          </div>


          <!-- =========================
               DIRECT 成本
               ========================= -->
          <div v-if="costMode === 'DIRECT'">

            <label
              class="
                block
                font-semibold
                text-[var(--on-surface-variant)]
                text-xs
                mb-1
              "
            >
              原物料成本 (NT$)
            </label>

            <div class="relative">

              <input
                v-model.number="cost"
                type="number"
                step="any"
                min="0"
                required
                class="
                  input-field
                  no-number-spinner
                  pr-14
                "
              />

              <span
                class="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-[var(--on-surface-variant)]
                  text-xs
                "
              >
                / {{ unit }}
              </span>

            </div>

          </div>


          <!-- =========================
               CONVERSION 採購單位
               ========================= -->
          <div v-else>

            <label
              class="
                block
                font-semibold
                text-[var(--on-surface-variant)]
                text-xs
                mb-1
              "
            >
              採購單位
            </label>

            <select
              v-model="purchaseUnit"
              required
              class="input-field"
            >
              <option value="kg">公斤 (kg)</option>
              <option value="g">公克 (g)</option>
              <option value="L">公升 (L)</option>
              <option value="ml">毫升 (ml)</option>
              <option value="瓶">瓶</option>
              <option value="包">包</option>
              <option value="桶">桶</option>
              <option value="個">個</option>
              <option value="箱">箱</option>
              <option value="支">支</option>
            </select>

          </div>

        </div>


        <!-- =========================
             CONVERSION 詳細資料
             ========================= -->
        <div
          v-if="costMode === 'CONVERSION'"
          class="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >

          <!-- 換算數量 -->
          <div>

            <label
              class="
                block
                font-bold
                text-[var(--on-surface)]
                text-xs
                mb-1
              "
            >
              採購單位換算 BOM 單位
              <span class="text-[var(--error)]">*</span>
            </label>

            <input
              v-model.number="conversionQuantity"
              type="number"
              min="0"
              step="any"
              required
              class="
                input-field
                no-number-spinner
                font-mono
              "
            />

            <div
              class="
                mt-2
                rounded-xl
                border
                border-[var(--outline)]
                bg-[var(--surface-container-high)]
                p-3.5
                text-xs
                text-[var(--on-surface-variant)]
              "
            >
              例如：買 1 瓶牛奶為 1850 毫升，
              就輸入 1850。
            </div>

          </div>


          <!-- 採購價格 -->
          <div>

            <label
              class="
                block
                font-bold
                text-[var(--on-surface)]
                text-xs
                mb-1
              "
            >
              採購價格
              <span class="text-[var(--error)]">*</span>
            </label>

            <input
              v-model.number="purchaseCost"
              type="number"
              min="0"
              step="any"
              required
              class="
                input-field
                no-number-spinner
                font-mono
              "
            />

            <!-- 換算後成本 -->
            <div
              class="
                mt-2
                rounded-xl
                border
                border-[var(--outline)]
                bg-[var(--surface-container-high)]
                p-3.5
                text-xs
                text-[var(--on-surface-variant)]
              "
            >
              <span>
                NT$ {{ unitCostPreview }}
                / {{ unit }}
              </span>
            </div>

          </div>

        </div>

      </div>

    </form>


    <!-- =========================
         Footer
         ========================= -->
    <template #footer="{ close }">

      <!--
        注意：
        這裡不是 emit('close')

        而是呼叫 ModalWrapper
        提供給 slot 的 close()

        所以會先經過 ModalWrapper
        的關閉確認。
      -->
      <button
        type="button"
        @click="close"
        class="btn-secondary text-xs"
      >
        取消
      </button>


      <button
        type="submit"
        form="edit-material-form"
        class="
          btn-primary
          text-xs
          flex
          items-center
          space-x-1.5
        "
      >

        <Check class="w-4 h-4" />

        <span>
          確認修改原物料
        </span>

      </button>

    </template>

  </ModalWrapper>

</template>


<script setup>

import {
  ref,
  watch,
  computed
} from 'vue'

import {
  PackagePlus,
  Check,
  Layers
} from 'lucide-vue-next'

import ModalWrapper
  from '../子元件/ModalWrapper.vue'

import httpClient
  from '@/service/httpClient'


// ==============================
// Props
// ==============================

const props = defineProps({

  isOpen: {
    type: Boolean,
    default: false
  },

  material: {
    type: Object,
    default: null
  }

})


// ==============================
// Emits
// ==============================

const emit = defineEmits([
  'close',
  'success'
])


// ==============================
// 表單資料
// ==============================

const code = ref('')
const name = ref('')
const unit = ref('')

const costMode = ref('DIRECT')

const cost = ref(null)

const purchaseUnit = ref('')
const conversionQuantity = ref(null)
const purchaseCost = ref(null)

const safetyStock = ref(null)


// ==============================
// Modal 開啟時
// 將原本 Material 資料填入表單
// ==============================

watch(
  () => props.isOpen,

  (isOpen) => {

    if (isOpen && props.material) {

      code.value =
        props.material.code ?? ''

      name.value =
        props.material.name ?? ''

      unit.value =
        props.material.unit ?? ''

      costMode.value =
        props.material.costMode ?? 'DIRECT'

      cost.value =
        Number(props.material.cost ?? 0)

      purchaseUnit.value =
        props.material.purchaseUnit ?? ''

      conversionQuantity.value =
        props.material.conversionQuantity != null
          ? Number(props.material.conversionQuantity)
          : null

      purchaseCost.value =
        props.material.purchaseCost != null
          ? Number(props.material.purchaseCost)
          : null

      safetyStock.value =
        Number(props.material.safetyStock ?? 0)


      console.log(
        '目前編輯原物料：',
        props.material
      )
    }
  }
)


// ==============================
// 換算後基本單位成本
// ==============================

const unitCostPreview = computed(() => {

  if (
    !purchaseCost.value ||
    !conversionQuantity.value ||
    conversionQuantity.value <= 0
  ) {
    return 0
  }

  return (
    purchaseCost.value /
    conversionQuantity.value
  )
})


// ==============================
// 儲存修改
// ==============================

const saveMaterial = () => {

  if (!props.material) {
    return
  }


  // ============================
  // 共通資料
  // ============================

  const data = {

    name:
      name.value.trim(),

    unit:
      unit.value,

    costMode:
      costMode.value,

    safetyStock:
      Number(safetyStock.value)

  }


  // ============================
  // DIRECT
  // ============================

  if (costMode.value === 'DIRECT') {

    data.cost =
      Number(cost.value)

  }


  // ============================
  // CONVERSION
  // ============================

  else if (
    costMode.value === 'CONVERSION'
  ) {

    data.purchaseUnit =
      purchaseUnit.value

    data.conversionQuantity =
      Number(conversionQuantity.value)

    data.purchaseCost =
      Number(purchaseCost.value)

  }


  console.log(
    '準備修改：',
    props.material.id,
    data
  )


  // ============================
  // PUT
  // ============================

  httpClient
    .put(
      `/api/materialupdate/${props.material.id}`,
      data
    )

    .then((response) => {

      console.log(
        '修改成功：',
        response.data
      )

      emit('success')

    })

    .catch((error) => {

      console.error(
        '修改失敗：',
        error.response?.data ?? error
      )

    })

}

</script>