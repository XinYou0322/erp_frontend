<template>

  <tr>
    <td>{{ orderNumber || '-' }}</td>
    <td>{{ supplierName || '-' }}</td>
    <td>{{  createdByName || '-'  }}</td>
    <td>{{ formatDate(createdAt) }}</td>
    <td>{{ formatDate(expectedDeliveryDate)}}</td>
    <td >{{ formattedTotal }}</td>
    <td >{{ statusInfo.label }}</td>

    <td>
      <div class="erp-u-flex erp-u-gap-8">
        <button
          class="erp-btn erp-btn--blue 
          "
          @click="showDetail"
        >查看</button>
        <button
          class="erp-btn erp-btn--soft"
          @click="showUpdate"
        >修改</button>
  
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
  supplierId: Number,
  supplierName: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  createdByUserId: Number,
  createdByName: {
    type: String,
    default: ''
  },

  // 簽核人
  approvedByUserId: Number,
  approvedByName: {
    type: String,
    default: ''
  },
  total: {
    type: [Number, String],
    default: 0
  },

  createdAt: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: String,
    default: ''
  },
  expectedDeliveryDate: {
    type: String,
    default: ''
  },
  receivedAt: {
    type: String,
    default: ''
  },
  receivedByUserId: Number,
  receivedByName: {
    type: String,
    default: ''
  },
  receiptUrl: {
    type: String,
    default: ''
  },
  decisionRemark: {
    type: String,
    default: ''
  },
})


// 宣告要傳給父元件的事件
const emit = defineEmits([
  'show-detail',
  'update-purchase-order',
])
// 將採購單總額格式化，例如：12500 -> NT$12,500
const formattedTotal = computed(() => {
  const amount = Number(props.total)

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
    DRAFT: {
      label: '草稿',
      className: 'purchase-order-status--draft'
    },

    PENDING_APPROVAL: {
      label: '待簽核',
      className: 'purchase-order-status--pending'
    },
    APPROVED: {
      label: '已核准',
      className: 'purchase-order-status--approved'
    },
    REJECTED: {
      label: '已退回',
      className: 'purchase-order-status--rejected'
    },
    RECEIVED: {
      label: '已收貨',
      className: 'purchase-order-status--received'
    },
    COMPLETED: {
      label: '已完成',
      className: 'purchase-order-status--completed'
    },
    CANCELLED: {
      label: '已取消',
      className: 'purchase-order-status--cancelled'
    },
    VOID: {
      label: '已作廢',
      className: 'purchase-order-status--cancelled'
    }
  }
    const normalizedStatus = props.status?.toUpperCase() //轉大寫

  return statusMap[normalizedStatus] ?? {
    label: props.status || '-',
    className: 'purchase-order-status--default'
  }
})

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return value.split('T')[0].replaceAll('-', '/')
}




//查看
function showDetail() {
  emit('show-detail', props.id)
}

function showUpdate() {
  emit('update-purchase-order', props.id)
}
</script>