import { useEffect, useRef, useState } from 'react'
import { t } from '../lib/i18n'

const COLORS = [
  { value: '#E53E3E' }, { value: '#ECC94B' }, { value: '#38A169' },
  { value: '#3182CE' }, { value: '#FFFFFF' }, { value: '#1A202C' },
]
const TOOLS = [
  { id: 'line',   icon: '╱' },
  { id: 'circle', icon: '◯' },
  { id: 'arrow',  icon: '→' },
  { id: 'text',   icon: 'T' },
]

export default function AnnotationCanvas({ imageUrl, onDone, onCancel, lang }) {
  const canvasRef  = useRef(null)
  const imgRef     = useRef(null)
  const [tool, setTool]       = useState('arrow')
  const [color, setColor]     = useState('#E53E3E')
  const [lineWidth, setLineWidth] = useState(4)
  const [shapes, setShapes]   = useState([])
  const [drawing, setDrawing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [textPos, setTextPos]   = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgRef.current = img; setImgLoaded(true); redraw([]) }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => { if (imgLoaded) redraw(shapes) }, [shapes, imgLoaded, selected])

  function redraw(shapeList) {
    const canvas = canvasRef.current; if (!canvas || !imgRef.current) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    const img = imgRef.current
    const scale = Math.min(W / img.width, H / img.height)
    const ox = (W - img.width * scale) / 2, oy = (H - img.height * scale) / 2
    ctx.drawImage(img, ox, oy, img.width * scale, img.height * scale)
    shapeList.forEach((s, i) => drawShape(ctx, s, i === selected))
  }

  function drawShape(ctx, s, isSel) {
    ctx.save()
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color
    ctx.lineWidth = s.lw || 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (isSel) { ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 8 }
    if (s.type === 'line') {
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke()
    } else if (s.type === 'circle') {
      const rx = Math.abs(s.x2 - s.x1) / 2, ry = Math.abs(s.y2 - s.y1) / 2
      ctx.beginPath(); ctx.ellipse(s.x1+(s.x2-s.x1)/2, s.y1+(s.y2-s.y1)/2, rx||1, ry||1, 0, 0, Math.PI*2); ctx.stroke()
    } else if (s.type === 'arrow') {
      const dx = s.x2-s.x1, dy = s.y2-s.y1
      const angle = Math.atan2(dy, dx), len = Math.sqrt(dx*dx+dy*dy), head = Math.min(20, len*0.35)
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(s.x2, s.y2)
      ctx.lineTo(s.x2 - head*Math.cos(angle-Math.PI/6), s.y2 - head*Math.sin(angle-Math.PI/6))
      ctx.lineTo(s.x2 - head*Math.cos(angle+Math.PI/6), s.y2 - head*Math.sin(angle+Math.PI/6))
      ctx.closePath(); ctx.fill()
    } else if (s.type === 'text') {
      ctx.font = `bold ${s.fontSize||22}px Inter, sans-serif`; ctx.fillText(s.text, s.x1, s.y1)
    }
    ctx.restore()
  }

  function getPos(e) {
    const r = canvasRef.current.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return { x: touch.clientX - r.left, y: touch.clientY - r.top }
  }

  function onPointerDown(e) {
    if (tool === 'text') { setTextPos(getPos(e)); setTextInput(''); return }
    const pos = getPos(e)
    const hitIdx = shapes.findIndex(s => hitTest(s, pos))
    if (hitIdx >= 0) { setSelected(hitIdx); return }
    setSelected(null)
    setDrawing({ type: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, color, lw: lineWidth })
  }

  function onPointerMove(e) {
    if (!drawing) return
    const pos = getPos(e)
    const updated = { ...drawing, x2: pos.x, y2: pos.y }
    setDrawing(updated); redraw([...shapes, updated])
  }

  function onPointerUp() {
    if (!drawing) return
    setShapes(prev => [...prev, drawing]); setDrawing(null)
  }

  function hitTest(s, pos) {
    const pad = 14
    if (s.type === 'text') return pos.x>s.x1-pad && pos.x<s.x1+120 && pos.y>s.y1-30 && pos.y<s.y1+pad
    const minX = Math.min(s.x1,s.x2)-pad, maxX = Math.max(s.x1,s.x2)+pad
    const minY = Math.min(s.y1,s.y2)-pad, maxY = Math.max(s.y1,s.y2)+pad
    return pos.x>=minX && pos.x<=maxX && pos.y>=minY && pos.y<=maxY
  }

  function placeText() {
    if (!textInput || !textPos) return
    setShapes(prev => [...prev, { type:'text', x1:textPos.x, y1:textPos.y, text:textInput, color, fontSize:22 }])
    setTextPos(null); setTextInput('')
  }

  function deleteSelected() { setShapes(prev => prev.filter((_,i) => i!==selected)); setSelected(null) }
  function undo() { setShapes(prev => prev.slice(0,-1)); setSelected(null) }

  function handleDone() { canvasRef.current.toBlob(blob => onDone(blob), 'image/jpeg', 0.92) }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button onClick={onCancel} className="text-white font-medium text-sm">{t('annotate.cancel', lang)}</button>
        <div className="flex gap-2">
          {TOOLS.map(tb => (
            <button key={tb.id} onClick={() => setTool(tb.id)}
              className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${tool===tb.id?'bg-brand-600 text-white':'bg-white/10 text-white'}`}>
              {tb.icon}
            </button>
          ))}
        </div>
        <button onClick={undo} className="text-white text-sm">{t('annotate.undo', lang)}</button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef}
          className="w-full h-full"
          onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp}
          onTouchStart={e=>{e.preventDefault();onPointerDown(e)}}
          onTouchMove={e=>{e.preventDefault();onPointerMove(e)}}
          onTouchEnd={onPointerUp}
          style={{ touchAction:'none', cursor: tool==='text' ? 'text' : 'crosshair' }}
        />
        {textPos && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-5 w-72 space-y-3 shadow-2xl mx-4">
              <p className="font-semibold text-gray-800">{t('annotate.addText', lang)}</p>
              <input autoFocus className="input" placeholder={t('annotate.typeHere', lang)} value={textInput} onChange={e=>setTextInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&placeText()} />
              <div className="flex gap-2">
                <button onClick={() => setTextPos(null)} className="flex-1 btn-secondary text-sm py-2">{t('annotate.cancel', lang)}</button>
                <button onClick={placeText} className="flex-1 btn-primary text-sm py-2">{t('annotate.place', lang)}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="bg-black/80 px-4 py-3 safe-bottom">
        <div className="flex justify-center gap-3 mb-3">
          {COLORS.map(c => (
            <button key={c.value} onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${color===c.value?'border-white scale-125':'border-transparent'}`}
              style={{ backgroundColor: c.value }} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-white/60 text-xs">{t('annotate.width', lang)}</span>
          <input type="range" min="2" max="12" value={lineWidth} onChange={e=>setLineWidth(+e.target.value)} className="w-32" />
          <span className="text-white/60 text-xs">{lineWidth}px</span>
        </div>
        <div className="flex gap-2">
          {selected !== null && (
            <button onClick={deleteSelected} className="btn-danger flex-1 py-2 text-sm">{t('annotate.delete', lang)}</button>
          )}
          <button onClick={handleDone} className="btn-primary flex-1 py-3">{t('annotate.done', lang)}</button>
        </div>
      </div>
    </div>
  )
}
