<template>
  <div class="world-map-viewport">
    <div v-if="!imagesLoaded" class="loading-overlay">
      Lade Kartenkacheln ({{ loadedImageCount }} / {{ totalImageCount }})...
    </div>
    <canvas
      ref="canvasRef"
      :width="CANVAS_WIDTH_PX"
      :height="CANVAS_HEIGHT_PX"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @mousemove="handleMouseMove"
      @wheel="handleWheel"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'

// --- Map-Konfiguration ---
const TILE_SIZE = 128
const MAP_WIDTH_TILES = 32
const MAP_HEIGHT_TILES = 24
const MAP_WIDTH_PX = MAP_WIDTH_TILES * TILE_SIZE
const MAP_HEIGHT_PX = MAP_HEIGHT_TILES * TILE_SIZE
const CANVAS_WIDTH_PX = 1024
const CANVAS_HEIGHT_PX = 640
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0

// Props
const props = defineProps({
  character: { type: Object, required: true },
})

// `ref` für DOM-Referenzen und einfache reaktive Werte
const canvasRef = ref(null)
const imagesLoaded = ref(false)
const isPanning = ref(false)
const loadedImageCount = ref(0)
const totalImageCount = ref(0)

// `reactive` für komplexe reaktive Objekte
const lastMousePos = reactive({ x: 0, y: 0 })
const viewTransform = reactive({
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
})

// Vite's Äquivalent zu require.context
const mapImageModules = import.meta.glob('@/assets/images/map/*.webp')
const imageCache = {}

// --- Logik zum Laden der Bilder ---
const loadMapImages = async () => {
  const imagePaths = Object.keys(mapImageModules)
  totalImageCount.value = imagePaths.length
  const imagePromises = imagePaths.map((path) => {
    const key = path.split('/').pop().replace('.webp', '')
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        imageCache[key] = img
        loadedImageCount.value++
        resolve()
      }
      img.onerror = reject
      mapImageModules[path]().then((mod) => {
        img.src = mod.default
      })
    })
  })

  await Promise.all(imagePromises)
  imagesLoaded.value = true
}

// --- Kern-Zeichenlogik ---
const draw = () => {
  const canvas = canvasRef.value
  if (!canvas || !imagesLoaded.value) return
  const ctx = canvas.getContext('2d')

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.translate(viewTransform.offsetX, viewTransform.offsetY)
  ctx.scale(viewTransform.scale, viewTransform.scale)

  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tileName = `map_${y + 1}x${x + 1}`
      if (imageCache[tileName]) {
        ctx.drawImage(
          imageCache[tileName],
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE + 1,
          TILE_SIZE + 1,
        )
      }
    }
  }

  if (props.character?.position) {
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(props.character.position.x, props.character.position.y, TILE_SIZE / 4, 0, 2 * Math.PI)
    ctx.fill()
  }

  ctx.restore()
}

// --- Hilfsfunktion für korrekte Bewegungsgrenzen ---
const clampOffsets = (newOffsetX, newOffsetY, scale) => {
  const scaledMapWidth = MAP_WIDTH_PX * scale
  const scaledMapHeight = MAP_HEIGHT_PX * scale

  let minX, maxX, minY, maxY

  if (scaledMapWidth < CANVAS_WIDTH_PX) {
    // Fall 1: Karte ist schmaler als das Fenster (herausgezoomt)
    minX = (CANVAS_WIDTH_PX - scaledMapWidth) / 2
    maxX = (CANVAS_WIDTH_PX - scaledMapWidth) / 2
  } else {
    // Fall 2: Karte ist breiter als das Fenster (hineingezoomt)
    minX = CANVAS_WIDTH_PX - scaledMapWidth
    maxX = 0
  }

  if (scaledMapHeight < CANVAS_HEIGHT_PX) {
    // Fall 1: Karte ist kleiner als das Fenster (herausgezoomt)
    minY = (CANVAS_HEIGHT_PX - scaledMapHeight) / 2
    maxY = (CANVAS_HEIGHT_PX - scaledMapHeight) / 2
  } else {
    // Fall 2: Karte ist größer als das Fenster (hineingezoomt)
    minY = CANVAS_HEIGHT_PX - scaledMapHeight
    maxY = 0
  }

  // Wende die korrekten Grenzen an
  viewTransform.offsetX = Math.max(minX, Math.min(newOffsetX, maxX))
  viewTransform.offsetY = Math.max(minY, Math.min(newOffsetY, maxY))
}

// --- Event Handlers ---
const handleMouseDown = (e) => {
  isPanning.value = true
  lastMousePos.x = e.clientX
  lastMousePos.y = e.clientY
}

const handleMouseUp = () => {
  isPanning.value = false
}

const handleMouseMove = (e) => {
  if (!isPanning.value) return
  const dx = e.clientX - lastMousePos.x
  const dy = e.clientY - lastMousePos.y
  lastMousePos.x = e.clientX
  lastMousePos.y = e.clientY

  const newOffsetX = viewTransform.offsetX + dx
  const newOffsetY = viewTransform.offsetY + dy

  clampOffsets(newOffsetX, newOffsetY, viewTransform.scale)
}

const handleWheel = (e) => {
  e.preventDefault()
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const worldX = (mouseX - viewTransform.offsetX) / viewTransform.scale
  const worldY = (mouseY - viewTransform.offsetY) / viewTransform.scale

  const scaleAmount = -e.deltaY * 0.001
  const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewTransform.scale + scaleAmount))

  const newOffsetX = mouseX - worldX * newScale
  const newOffsetY = mouseY - worldY * newScale

  viewTransform.scale = newScale // Wende den Zoom an
  clampOffsets(newOffsetX, newOffsetY, newScale) // Wende die korrekten Grenzen an
}

// --- Lifecycle & Watcher ---
onMounted(async () => {
  await loadMapImages()
})

watch(
  [
    () => viewTransform.offsetX,
    () => viewTransform.offsetY,
    () => viewTransform.scale,
    imagesLoaded,
  ],
  draw,
  { immediate: true },
)
</script>

<style scoped>
/* Hier den Inhalt von WorldMap.css einfügen */
.world-map-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
  cursor: grab;
  position: relative; /* Für das Lade-Overlay */
}

.world-map-viewport:active {
  cursor: grabbing;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  background-color: rgba(0, 0, 0, 0.8);
  font-size: 1.5em;
}

canvas {
  display: block;
}
</style>
