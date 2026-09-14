<template>

  <Teleport to="body">

    <div
      v-if="isOpen"
      class="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        p-4
        bg-black/60
        backdrop-blur-md
        transition-all
      "
      @click.self="handleBackdropClick"
    >

      <div
        :id="id"
        class="
          w-full
          bg-[var(--surface-container)]
          text-[var(--on-surface)]
          rounded-2xl
          shadow-2xl
          border
          border-[var(--outline)]
          overflow-hidden
          max-h-[90vh]
          flex
          flex-col
          animate-in
          fade-in
          zoom-in-95
          duration-200
        "
        :class="maxWidthClass"
      >

        <!-- Modal Header -->
        <div
          class="
            px-6
            py-4
            bg-[var(--surface-container-high)]
            border-b
            border-[var(--outline)]
            flex
            items-center
            justify-between
            shrink-0
          "
        >

          <div class="flex items-center space-x-2.5">

            <slot name="header-icon">

              <div
                v-if="icon"
                class="
                  w-8
                  h-8
                  rounded-lg
                  bg-[var(--primary)]/15
                  text-[var(--primary)]
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >

                <component
                  :is="icon"
                  class="w-4 h-4"
                />

              </div>

            </slot>


            <div>

              <h3
                class="
                  font-bold
                  text-lg
                  text-[var(--on-surface)]
                  leading-tight
                "
              >
                {{ title }}
              </h3>


              <p
                v-if="subtitle"
                class="
                  text-xs
                  text-[var(--on-surface-variant)]
                  mt-0.5
                "
              >
                {{ subtitle }}
              </p>

            </div>

          </div>


          <!-- 右上角 X -->
          <button
            type="button"
            @click="requestClose"
            class="
              w-8
              h-8
              rounded-full
              flex
              items-center
              justify-center
              text-[var(--on-surface-variant)]
              hover:text-[var(--on-surface)]
              hover:bg-[var(--surface-container-highest)]
              transition-colors
              cursor-pointer
            "
            title="關閉"
          >

            <X class="w-5 h-5" />

          </button>

        </div>


        <!-- Modal Body -->
        <div
          class="
            p-6
            overflow-y-auto
            space-y-5
            flex-1
            text-sm
            bg-[var(--surface-container)]
            text-[var(--on-surface)]
          "
        >

          <slot />

        </div>


        <!-- Modal Footer -->
        <div
          v-if="$slots.footer"
          class="
            px-6
            py-4
            bg-[var(--surface-container-low)]
            border-t
            border-[var(--outline)]
            flex
            items-center
            justify-between
            shrink-0
          "
        >

          <!--
            讓子元件可以直接使用 close()
            例如：
            <template #footer="{ close }">
          -->
          <slot
            name="footer"
            :close="requestClose"
          />

        </div>

      </div>

    </div>

  </Teleport>

</template>


<script setup >

import { computed } from 'vue'



import { X } from 'lucide-vue-next'


const props = defineProps({

  isOpen: {
    type: Boolean,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  subtitle: {
    type: String,
    default: ''
  },

  id: {
    type: String,
    default: ''
  },

  maxWidth: {
    type: String,
    default: '2xl'
  },

  icon: {
    type: Object,
    default: null
  },

  closeOnBackdrop: {
    type: Boolean,
    default: true
  },

  confirmClose: {
    type: Boolean,
    default: true
  },

  confirmCloseMessage: {
    type: String,
    default: '確定要關閉嗎？尚未儲存的資料將會遺失。'
  }

})


const emit = defineEmits([
  'close',

])


const maxWidthClass = computed(() => {

  switch (props.maxWidth) {

    case 'sm':
      return 'max-w-sm'

    case 'md':
      return 'max-w-md'

    case 'lg':
      return 'max-w-lg'

    case 'xl':
      return 'max-w-xl'

    case '3xl':
      return 'max-w-3xl'

    case '6xl':
      return 'max-w-6xl'

    default:
      return 'max-w-2xl'

  }

})


// ====================================
// 統一關閉入口
// ====================================

const requestClose = () => {

  if (props.confirmClose) {

    const confirmed = window.confirm(
      props.confirmCloseMessage
    )

    if (!confirmed) {
      return
    }

  }

  emit('close')

}


// ====================================
// 點背景關閉
// ====================================

const handleBackdropClick = () => {

  if (!props.closeOnBackdrop) {
    return
  }

  requestClose()

}

</script>