export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
      {/* Backdrop - clicking it does NOT close the modal */}
      <div className="absolute inset-0" />
      <div className="relative bg-white rounded-t-3xl max-h-[92vh] flex flex-col safe-bottom">
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center active:scale-95">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
