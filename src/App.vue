<script setup lang="ts">
import QRCodeGenerator from './components/QRCodeGenerator.vue'
import { ElText } from 'element-plus'
</script>

<template>
  <div>
    <el-text tag="h1" size="large" style="font-size:2.5rem; font-weight:bold;">QR 코드 생성기</el-text>
    <QRCodeGenerator />
  </div>
</template>

<style scoped>
</style>
