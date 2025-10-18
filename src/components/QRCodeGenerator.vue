<template>
  <div class="qr-generator-layout">
    <el-space direction="vertical" fill>
      <canvas ref="canvas" style="width:200px; height:200px;" />
      <el-button type="primary" @click="downloadQRImage" :icon="Download">다운로드</el-button>
      <el-button type="warning" @click="goToBuyMeACoffee" :icon="Coffee">
        개발자에게 커피 사주기
      </el-button>
    </el-space>
    <el-card class="qr-card" shadow="none">
      <el-container direction="vertical" class="qr-container">
        <el-form label-position="left" label-width="100px">
          <el-form-item label="QR 코드 내용">
            <el-input v-model="text" placeholder="문자열을 입력하세요" clearable />
          </el-form-item>
          <el-form-item label="색상">
            <el-color-picker :model-value="color" @active-change="onColorChange" :predefine="presetColors" :show-alpha="false" />
          </el-form-item>
          <el-form-item label="스타일">
            <el-space>
              <div
                class="qr-style-preview"
                :class="{ selected: dotStyle === 'square' }"
                @click="dotStyle = 'square'"
              >
                <canvas ref="previewSquare" width="50" height="50" />
              </div>
              <div
                class="qr-style-preview"
                :class="{ selected: dotStyle === 'circle' }"
                @click="dotStyle = 'circle'"
              >
                <canvas ref="previewCircle" width="50" height="50" />
              </div>
            </el-space>
          </el-form-item>
          <el-form-item>
            <template #label>
              <el-space>
                <span>
                  배경
                </span>
                <el-button type="danger" @click="removeBgImage" :disabled="!uploadedImg" :icon="Delete" link />
              </el-space>
            </template>
            <el-space>
              <el-upload
                  :show-file-list="false"
                  :on-change="onImageChange"
                  accept="image/*"
                  action=""
                  :auto-upload="false"
              >
                <el-button type="default">업로드</el-button>
              </el-upload>
            </el-space>
          </el-form-item>
        </el-form>
      </el-container>
    </el-card>
  </div>
  <div class="copyright">© 2025 CrazyThink.</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import QRCode from 'qrcode';
import { Coffee, Download, Delete } from '@element-plus/icons-vue';

const text = ref('https://crazythink.github.io/qr');
const color = ref('#000000');
const dotStyle = ref('square');
const canvas = ref<HTMLCanvasElement | null>(null);
const previewSquare = ref<HTMLCanvasElement | null>(null);
const previewCircle = ref<HTMLCanvasElement | null>(null);
const CANVAS_SIZE = 1600;
const QR_MARGIN = 240;
const uploadedImg = ref<HTMLImageElement | null>(null);

const presetColors = [
  '#000000', // 검정
  '#ff8da1', // 진한 핑크
  '#6fcf97', // 진한 민트
  '#ffb86b', // 진한 오렌지
  '#5dade2', // 진한 블루
  '#a685e2', // 진한 퍼플
  '#ffe066', // 진한 옐로우
  '#7ed957'  // 진한 연두
];

function onColorChange(val: string) {
  color.value = val;
}

function onImageChange(file: any) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new window.Image();
    img.onload = () => { uploadedImg.value = img; generateQRCode(); };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file.raw);
}

function drawDot(ctx: CanvasRenderingContext2D, style: string, x: number, y: number, size: number, color: string, img?: HTMLImageElement, cellSize?: number) {
  ctx.save();
  if (img && cellSize) {
    // 이미지가 캔버스와 크기가 다를 경우, QR코드 영역에 맞게 crop 좌표 변환
    const scaleX = img.width / CANVAS_SIZE;
    const scaleY = img.height / CANVAS_SIZE;
    const srcX = (x - size / 2) * scaleX;
    const srcY = (y - size / 2) * scaleY;
    const srcW = size * scaleX;
    const srcH = size * scaleY;
    ctx.beginPath();
    if (style === 'circle') {
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(x - size / 2, y - size / 2, size, size);
    }
    ctx.clip();
    ctx.drawImage(
        img,
        srcX, srcY, srcW, srcH, // 이미지에서 점 위치에 해당하는 부분 crop (스케일 적용)
        x - size / 2, y - size / 2, size, size // 캔버스에 점 위치에 그림
    );
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    switch (style) {
      case 'square':
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
    ctx.restore();
  }
}

function toHexColor(input: string): string {
  // 이미 #RRGGBB 또는 #RRGGBBAA 형태면 앞 7글자만 반환
  if (input.startsWith('#')) {
    return input.slice(0, 7);
  }
  // rgb/rgba 형태면 hex로 변환
  const rgbMatch = input.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = rgbMatch[1] ? parseInt(rgbMatch[1], 10) : 0;
    const g = rgbMatch[2] ? parseInt(rgbMatch[2], 10) : 0;
    const b = rgbMatch[3] ? parseInt(rgbMatch[3], 10) : 0;
    return (
        '#' +
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0')
    );
  }
  // 기타: 기본값
  return '#000000';
}

function drawPreviewCanvas(previewCanvas: HTMLCanvasElement, style: string) {
  const ctx = previewCanvas.getContext('2d');
  if (!ctx) return;

  const size = 50;
  const cellSize = 5;
  const cols = 7;
  const rows = 7;
  const offsetX = (size - cols * cellSize) / 2;
  const offsetY = (size - rows * cellSize) / 2;

  // 배경을 흰색으로
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);

  // 간단한 QR 패턴 그리기 (위치 감지 패턴)
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1]
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pattern[r]?.[c]) {
        const x = offsetX + c * cellSize + cellSize / 2;
        const y = offsetY + r * cellSize + cellSize / 2;
        drawDot(
          ctx,
          style,
          x,
          y,
          cellSize,
          '#000000'
        );
      }
    }
  }
}

function updatePreviews() {
  if (previewSquare.value) {
    drawPreviewCanvas(previewSquare.value, 'square');
  }
  if (previewCircle.value) {
    drawPreviewCanvas(previewCircle.value, 'circle');
  }
}

const generateQRCode = async () => {
  if (!canvas.value) return;
  await nextTick();
  canvas.value.width = CANVAS_SIZE;
  canvas.value.height = CANVAS_SIZE;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  if (text.value.trim() === '') return;
  const solidColor = toHexColor(color.value);
  let qrData;
  try {
    qrData = await QRCode.create(text.value, { errorCorrectionLevel: 'H' });
  } catch (e) {
    ctx.fillStyle = '#f00';
    ctx.font = '16px sans-serif';
    ctx.fillText('QR 생성 오류', 20, CANVAS_SIZE / 2);
    return;
  }
  const cellSize = (CANVAS_SIZE - 2 * QR_MARGIN) / qrData.modules.size;
  if (!uploadedImg.value) {
    for (let r = 0; r < qrData.modules.size; r++) {
      for (let c = 0; c < qrData.modules.size; c++) {
        if (qrData.modules.data[r * qrData.modules.size + c]) {
          drawDot(
              ctx,
              dotStyle.value,
              QR_MARGIN + c * cellSize + cellSize / 2,
              QR_MARGIN + r * cellSize + cellSize / 2,
              cellSize,
              solidColor
          );
        }
      }
    }
  } else {
    for (let r = 0; r < qrData.modules.size; r++) {
      for (let c = 0; c < qrData.modules.size; c++) {
        if (qrData.modules.data[r * qrData.modules.size + c]) {
          drawDot(
              ctx,
              dotStyle.value,
              QR_MARGIN + c * cellSize + cellSize / 2,
              QR_MARGIN + r * cellSize + cellSize / 2,
              cellSize,
              solidColor,
              uploadedImg.value,
              cellSize
          );
        }
      }
    }
  }
};

function downloadQRImage() {
  if (!canvas.value) return;
  const link = document.createElement('a');
  link.href = canvas.value.toDataURL('image/png');
  link.download = 'qr-code.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function goToBuyMeACoffee() {
  window.open('https://buymeacoffee.com/crazythink', '_blank');
}

function removeBgImage() {
  uploadedImg.value = null;
  generateQRCode();
}

onMounted(async () => {
  await nextTick();
  updatePreviews();
  generateQRCode();
});

watch([text, color, dotStyle], generateQRCode);
</script>

<style scoped>
.qr-generator-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
}
.qr-card {
  max-width: 350px;
  width: 100%;
  padding: 1.5rem 1rem;
}
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.el-form {
  width: 100%;
}
.el-form-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}
.el-form-item__label {
  min-width: 100px;
  margin-right: 12px;
  text-align: right;
}
.el-form-item__content {
  flex: 1;
}
canvas {
  border: 1px solid #eee;
  background: #fff;
  box-shadow: 0 2px 8px #0001;
  border-radius: 8px;
  min-width: 40px;
  min-height: 40px;
  display: block;
}
.qr-style-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 8px;
  transition: all 0.2s;
  background: #fff;
}
.qr-style-preview:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}
.qr-style-preview.selected {
  border-color: #409eff;
  background: #e6f7ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
.qr-style-preview canvas {
  border: none;
  box-shadow: none;
  border-radius: 4px;
}
.copyright {
  width: 100%;
  text-align: center;
  color: #888;
  font-size: 0.95rem;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.01em;
}
</style>

