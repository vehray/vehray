<template>
  <div v-if="visible" class="drag-hint-overlay">{{ text }}</div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  text: string;
}>();
</script>

<style scoped>
.drag-hint-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 15, 15, 0.5);
  color: #fca5a5;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  pointer-events: none;
  z-index: 12;
}
</style>
