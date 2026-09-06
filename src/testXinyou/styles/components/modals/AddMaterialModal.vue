<script setup>

import { ref, watch } from 'vue'
import { PackagePlus, Check, Layers } from 'lucide-vue-next'

import ModalWrapper from '../common/ModalWrapper.vue'
import httpClient from '@/service/httpClient'


const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})


const emit = defineEmits([
  'close',
  'success'
])


const name = ref('')
const code = ref('')
const unit = ref('kg')
const cost = ref(0)
const safetyStock = ref(0)


watch(
  () => props.isOpen,

  (isOpen) => {

    if (isOpen) {

      name.value = ''
      code.value = ''
      unit.value = 'kg'
      cost.value = 0
      safetyStock.value = 0

    }

  }
)


const handleSubmit = () => {

  const data = {

    code: code.value.trim(),

    name: name.value.trim(),

    unit: unit.value,

    cost: Number(cost.value),

    safetyStock: Number(safetyStock.value)

  }


  console.log(
    '準備新增的原物料：',
    data
  )


  httpClient
    .post('/api/material', data)

    .then((response) => {

      console.log(
        '新增原物料成功：',
        response.data
      )

      emit('success')

      emit('close')

    })

    .catch((error) => {

      console.error(
        '新增原物料失敗：',
        error
      )

    })

}

</script>