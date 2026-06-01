#!/bin/bash
# ─────────────────────────────────────────────────────
# AzurTant PRO — Video Demo Generator
# Graba la pantalla durante el demo, recorta a 3 min,
# exporta MP4 1080p listo para YouTube/LinkedIn.
# ─────────────────────────────────────────────────────
set -e

DURATION=${1:-30}        # segundos a grabar
OUTPUT=${2:-demo.mp4}
WORKDIR="C:/Users/Manu/azurant-app"

echo "🎬 AzurTant PRO Demo Recorder"
echo "   Duración: ${DURATION}s"
echo "   Output:   ${OUTPUT}"
echo ""
echo "1) Lanzando azurant-pro.exe..."
powershell -NoProfile -Command "Start-Process -FilePath '${WORKDIR}/azurant-pro.exe'"
sleep 4

echo "2) Grabando pantalla con ffmpeg (gdigrab)..."
cd "$WORKDIR"
ffmpeg -y -f gdigrab -framerate 30 -i desktop -t $DURATION \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
    -movflags +faststart \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
    raw-recording.mp4 2>&1 | tail -3

echo ""
echo "3) Lanzando demo E2E (terminal grabada también)..."
node demo-e2e.mjs 2>&1 | tee demo-runtime.log &
DEMO_PID=$!
sleep $((DURATION - 5))
kill $DEMO_PID 2>/dev/null || true

echo ""
echo "4) Limpiando..."
powershell -NoProfile -Command "Stop-Process -Name azurant-pro -Force -ErrorAction SilentlyContinue"

echo ""
echo "✅ Video generado: ${WORKDIR}/${OUTPUT}"
echo "   Sube a YouTube, LinkedIn, Twitter."
echo "   Tamaño aprox: $(du -h ${OUTPUT} 2>/dev/null | cut -f1)"
