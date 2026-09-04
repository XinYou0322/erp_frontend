<template>

  <tr>
    <td>{{ id }}</td>
    <td>{{ name }}</td>
    <td>{{ phone }}</td>
    <td>{{ address }}</td>
    <td>{{ email }}</td>
    <td>
      <div class="erp-u-flex erp-u-gap-8">
        <button
          class="erp-btn erp-btn--cyan
          "
          @click="showDetail"
        >查看</button>
        <button
          class="erp-btn erp-btn--danger"
          @click="editSupplier"
        >修改</button>
        <!-- 刪除 -->
        <button
          class="erp-btn erp-btn--danger"
          @click="deleteSupplier"
          >刪除</button>
      </div>
    </td>
  </tr>

</template>
<script setup>
// 接收父元件資料
const props = defineProps({
  id: Number,
  name: String,
  phone: String, 
  address: String,
  email: String
})
// 宣告要傳給父元件的事件
const emit = defineEmits([
  'showDetail',
  'editSupplier',
  'deleteSupplier'
])
// 查看
function showDetail() {
  emit(
    'showDetail',
    props.id
  )
}
// 修改
function editSupplier() {
  emit(
    'editSupplier',
    {
      id: props.id,
      name: props.name,
      phone: props.phone,
      address: props.address,
      email: props.email
    }
  )
}
// 刪除
function deleteSupplier() {
  emit(
    'deleteSupplier',
    props.id
  )
}

</script>

<style scoped>


</style>