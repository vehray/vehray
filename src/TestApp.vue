<template>
  <div class="test-app">
    <h1>测试应用</h1>
    <p>这是一个测试应用，用于验证Vue应用是否能够正常渲染。</p>
    <el-button type="primary">测试按钮</el-button>
  </div>
</template>

<script setup lang="ts">
// 测试应用组件
</script>

<style scoped>
.test-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}

h1 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
}

p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}
</style>