<script setup lang="ts">
import QRCodeGenerator from './components/QRCodeGenerator.vue'
</script>

<template>
  <div>
    <h1>QR 코드 생성기</h1>
    <QRCodeGenerator />
  </div>
</template>

<style scoped>
h1 {
  text-align: center;
  margin-top: 2rem;
  color: #333;
}
</style>
