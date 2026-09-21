<template>

  <tr>
    <td>{{ orderNumber || '-' }}</td>
    <td>{{ paymentMethodInfo.label }}</td>
    <td>{{  createdByName || '-'  }}</td>
    <td>{{ formatDateTime(createdAt) }}</td>
    <td>{{ formattedTotalAmount}}</td>
    <td >{{  statusInfo.label  }}</td>

    <td>
      <div class="erp-u-flex erp-u-gap-8">
        <button
          class="erp-btn erp-btn--blue"
          @click="showDetail"
        >查看</button>
        <button
          class="erp-btn erp-btn--soft"
          :disabled="!canVoid"
          :title="canVoid ? '作廢這筆銷售單' : '這筆銷售單已作廢'"
          @click="voidSalesOrder"
        >
          {{ canVoid ? '作廢' : '已作廢' }}
        </button>
      </div>
    </td>
  </tr>

</template>
<script setup>
import { computed } from 'vue'

// 接收父元件資料
const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  // 單號
  orderNumber: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  totalAmount: {
    type: [Number, String],
    default: 0
  },
  createdById: Number,
  createdByName: {
    type: String,
    default: ''
  },
  voidedById: Number,
  voidedByName: {
    type: String,
    default: ''
  },
  createdAt: {
    type: String,
    default: ''
  },
  voidedAt: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  },
  voidReason: {
    type: String,
    default: ''
  },
  // 銷售明細；目前列表不直接顯示，可在查看明細時使用
  items: {
    type: Array,
    default: () => []
  }

})


// 宣告要傳給父元件的事件
const emit = defineEmits([
  'show-detail',
  'void-sales-order',
])

// 將採購單總額格式化，例如：12500 -> NT$12,500
const formattedTotalAmount = computed(() => {
  const amount = Number(props.totalAmount)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
})

const statusInfo = computed(() => {
  const statusMap = {
    COMPLETED: {
      label: '已完成'
    },
    VOIDED: {
      label: '已作廢'
    }
  }

  const normalizedStatus = props.status?.toUpperCase()

  return statusMap[normalizedStatus] ?? {
    label: props.status || '-'
  }
})
const paymentMethodInfo = computed(() => {
  const paymentMethodMap = {
    CASH: {
      label: '現金'
    },
    CREDIT_CARD: {
      label: '信用卡'
    },
    MOBILE_PAYMENT: {
      label: '行動支付'
    }
  }

  const normalizedPaymentMethod = props.paymentMethod?.toUpperCase()

  return paymentMethodMap[normalizedPaymentMethod] ?? {
    label: props.paymentMethod || '-'
  }
})

const canVoid = computed(() => {
  return props.status?.toUpperCase() === 'COMPLETED'
})


function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const [datePart, timePart = ''] = value.split('T')
  const formattedDate = datePart.replaceAll('-', '/')
  const formattedTime = timePart.slice(0, 5)

  return formattedTime
    ? `${formattedDate} ${formattedTime}`
    : formattedDate
}




//查看
function showDetail() {
  emit('show-detail', props.id)
}

function voidSalesOrder() {
  if (!canVoid.value) {
    return
  }

  emit('void-sales-order', props.id)
}
</script>