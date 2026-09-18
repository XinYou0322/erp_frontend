<template>

  <tr>
    <td>{{serialNumber}}</td>
    <td>{{ name }}</td>
    <td>{{  fullPhone  }}</td>
    <td>{{ address }}</td>
    <td>{{ email }}</td>
    <td>{{ status }}</td>

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
        <!-- 刪除
        <button
          class="erp-btn erp-btn--danger"
          @click="deleteSupplier"
          >刪除</button> -->
      </div>
    </td>
  </tr>

</template>
<script setup>
import { computed } from 'vue'

// 接收父元件資料
const props = defineProps({
  serialNumber: Number,
  id: Number,
  name: String,

  callingCode: String,
  phone: String,
  extension: {
    type: String,
    default: ''
  },

  address: String,
  email: String,
  status: String
})

// 宣告要傳給父元件的事件
const emit = defineEmits([
  'show-detail',
  'update-supplier',
  // 'deleteSupplier'
])
// 組合電話顯示
const fullPhone = computed(() => {
    let result = ''
     if (props. callingCode) {
      result += props. callingCode
       }
     if (props.phone) {
       if (result) {    
          result += ' '
          }
       result += props.phone
       }
     if (props.extension) {
       result += ` #${props.extension}`
       }
        return result || '-' 
})  
//查看
function showDetail() {
  emit('show-detail')
}

function showUpdate() {
  emit('update-supplier')
}
</script>