<template>
  <div class="test2-page">
    <canvas ref="canvasRef" width="200" height="200" class="canvas" id="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
const canvasRef = ref();

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  ctx.font = '30px serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('阿里巴巴大厦', 100, 100, 200);
});
</script>

<style lang="less" scoped>
.test2-page {
  width: 100%;
  height: 100%;
  .canvas {
    border: 1px solid #eeeeee;
  }
}
</style>
