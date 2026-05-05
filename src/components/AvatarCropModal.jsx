import { useState, useRef, useEffect, useCallback } from 'react'

export default function AvatarCropModal({ imageUrl, onDone, onCancel, lang }) {
  const canvasRef    = useRef(null)
  const imgRef       = useRef(null)
  const defaultScale = useRef(1)
  const defaultOffset = useRef({ x: 0, y: 0 })

  const [scale, setScale]       = useState(1)
  const [offset, setOffset]     = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [minScale, setMinScale]   = useState(1)
  const [maxScale, setMaxScale]   = useState(6)
  const [error, setError]         = useState('')
  const SIZE = 300

  useEffect(() => {
    setImgLoaded(false)
    setError('')
    fetch(imageUrl)
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          imgRef.current = img
          // fillScale = image always fills the circle (no gaps ever)
          const fillScale = Math.max(SIZE / img.width, SIZE / img.height)
          const ox = (SIZE - img.width  * fillScale) / 2
          const oy = (SIZE - img.height * fillScale) / 2
          defaultScale.current  = fillScale
          defaultOffset.current = { x: ox, y: oy }
          setMinScale(fillScale)        // can never zoom out past fill
          setMaxScale(fillScale * 4)    // can zoom in up to 4x
          setScale(fillScale)
          setOffset({ x: ox, y: oy })
          setImgLoaded(true)
        }
        img.onerror = () => setError('Could not load image.')
        img.src = blobUrl
      })
      .catch(() => setError('Could not load image. Please choose a new photo.'))
  }, [imageUrl])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(imgRef.current, offset.x, offset.y, imgRef.current.width * scale, imgRef.current.height * scale)
    ctx.restore()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = '#3182CE'
    ctx.lineWidth = 3
    ctx.stroke()
  }, [scale, offset])

  useEffect(() => { if (imgLoaded) draw() }, [draw, imgLoaded])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  function onDown(e) {
    e.preventDefault()
    setDragging(true)
    setDragStart({ pos: getPos(e), offset: { ...offset } })
  }

  function onMove(e) {
    e.preventDefault()
    if (!dragging || !dragStart) return
    const pos = getPos(e)
    setOffset({
      x: dragStart.offset.x + (pos.x - dragStart.pos.x),
      y: dragStart.offset.y + (pos.y - dragStart.pos.y)
    })
  }

  function onUp() { setDragging(false); setDragStart(null) }

  function handleScale(e) {
    const newScale = parseFloat(e.target.value)
    const cx = SIZE / 2, cy = SIZE / 2
    const ratio = newScale / scale
    setOffset(prev => ({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio
    }))
    setScale(newScale)
  }

  function handleReset() {
    setScale(defaultScale.current)
    setOffset({ ...defaultOffset.current })
  }

  function handleDone() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => {
      if (blob) onDone(blob)
      else alert('Could not export. Try again.')
    }, 'image/jpeg', 0.92)
  }

  const L = lang === 'es'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-bold text-gray-800 text-lg mb-1 text-center">
          {L ? 'Ajustar foto' : 'Adjust Photo'}
        </h2>
        <p className="text-gray-400 text-xs text-center mb-4">
          {L ? 'Arrastra para mover · Desliza para hacer zoom' : 'Drag to reposition · Slide to zoom'}
        </p>

        {error ? (
          <div className="text-center py-8">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button onClick={onCancel} className="btn-secondary px-6 py-2">{L ? 'Cerrar' : 'Close'}</button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {!imgLoaded && (
                <div className="w-[300px] h-[300px] rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="rounded-full overflow-hidden shadow-lg" style={{ width: SIZE, height: SIZE, display: imgLoaded ? 'block' : 'none' }}>
                <canvas
                  ref={canvasRef}
                  width={SIZE}
                  height={SIZE}
                  className="cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                  onMouseDown={onDown}
                  onMouseMove={onMove}
                  onMouseUp={onUp}
                  onMouseLeave={onUp}
                  onTouchStart={onDown}
                  onTouchMove={onMove}
                  onTouchEnd={onUp}
                />
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">🔍</span>
                <button
                  onClick={handleReset}
                  className="text-xs bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full active:scale-95">
                  {L ? '↺ Reiniciar' : '↺ Reset'}
                </button>
                <span className="text-gray-400 text-sm">🔎</span>
              </div>
              <input
                type="range"
                min={minScale}
                max={maxScale}
                step={0.001}
                value={scale}
                onChange={handleScale}
                className="w-full accent-brand-600"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 btn-secondary py-3">
                {L ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={handleDone} disabled={!imgLoaded} className="flex-1 btn-primary py-3">
                {L ? '✓ Listo' : '✓ Apply'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
