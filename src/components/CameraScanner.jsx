import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, CheckCircle } from 'lucide-react'

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.CODE_128,
]

export default function CameraScanner({ onDetect, onClose }) {
  const [status,    setStatus]    = useState('starting')  // starting | scanning | error
  const [lastCode,  setLastCode]  = useState(null)
  const [errorMsg,  setErrorMsg]  = useState('')
  const scannerRef  = useRef(null)
  const startedRef  = useRef(false)
  const cooldownRef = useRef(null)
  const lastCodeRef = useRef(null)

  useEffect(() => {
    // Unique id to avoid React StrictMode conflicts
    const uid = `eb-cam-${Date.now()}`
    const el  = document.createElement('div')
    el.id     = uid
    document.getElementById('eb-cam-mount')?.appendChild(el)

    const scanner = new Html5Qrcode(uid, { formatsToSupport: FORMATS, verbose: false })
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 30,
        qrbox: (w, h) => ({ width: Math.min(340, w - 16), height: Math.min(120, h - 60) }),
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      },
      (code) => {
        const trimmed = code.trim()
        // cooldown: ignore same code within 1.5s
        if (trimmed === lastCodeRef.current) return
        lastCodeRef.current = trimmed
        clearTimeout(cooldownRef.current)
        cooldownRef.current = setTimeout(() => { lastCodeRef.current = null }, 1500)

        setLastCode(trimmed)
        setTimeout(() => setLastCode(null), 2000)
        onDetect(trimmed)
      },
      undefined
    )
      .then(() => { startedRef.current = true; setStatus('scanning') })
      .catch(() => {
        setStatus('error')
        setErrorMsg('No se pudo acceder a la cámara. Verifica los permisos en el navegador.')
      })

    return () => {
      clearTimeout(cooldownRef.current)
      if (startedRef.current && scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => el.remove())
      } else {
        el.remove()
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl overflow-hidden shadow-modal rounded-t-2xl">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
              <Camera size={16} className="text-brand-red" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Escanear con cámara</p>
              <p className="text-[11px] text-gray-400">Apunta al código de barras del producto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
          >
            <X size={15} />
          </button>
        </div>

        {status === 'error' ? (
          <div className="p-10 text-center">
            <Camera size={44} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700 mb-1">Sin acceso a la cámara</p>
            <p className="text-xs text-gray-400 mb-5">{errorMsg}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-brand-red/90 transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Camera viewport mount point */}
            <div className="relative bg-black" style={{ minHeight: 280 }}>
              <div id="eb-cam-mount" className="w-full" />

              {/* Detected feedback overlay */}
              {lastCode && (
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-2.5 bg-green-500 text-white px-4 py-2.5 rounded-xl shadow-lg">
                  <CheckCircle size={16} className="flex-shrink-0" />
                  <span className="text-sm font-semibold truncate">Detectado: {lastCode}</span>
                </div>
              )}

              {/* Starting indicator */}
              {status === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin block mx-auto mb-2" />
                    <p className="text-xs text-white/70">Iniciando cámara...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {status === 'scanning' ? 'Detectando automáticamente...' : 'Preparando...'}
              </p>
              <div className={`w-2 h-2 rounded-full ${status === 'scanning' ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
