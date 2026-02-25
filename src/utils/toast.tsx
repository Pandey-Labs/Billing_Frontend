import React from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastItem = {
  id: string
  type: ToastType
  message: string
}

type ToastListener = (item: ToastItem) => void

const listeners = new Set<ToastListener>()

const emit = (item: ToastItem) => {
  listeners.forEach((l) => l(item))
}

const push = (type: ToastType, message: string) => {
  const safeMessage = String(message || '').trim() || 'Something went wrong'
  emit({ id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, type, message: safeMessage })
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
  warning: (message: string) => push('warning', message),
}

export const ToastContainer: React.FC<{ autoClose?: number; position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }> = ({
  autoClose = 3000,
  position = 'top-right',
}) => {
  const [items, setItems] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    const listener: ToastListener = (item) => {
      setItems((prev) => [...prev, item])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== item.id))
      }, autoClose)
    }

    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [autoClose])

  const posStyle = (() => {
    const common: React.CSSProperties = { position: 'fixed', zIndex: 2000 }
    if (position === 'top-left') return { ...common, top: 16, left: 16 }
    if (position === 'bottom-right') return { ...common, bottom: 16, right: 16 }
    if (position === 'bottom-left') return { ...common, bottom: 16, left: 16 }
    return { ...common, top: 16, right: 16 }
  })()

  const toClass = (type: ToastType) => {
    if (type === 'success') return 'alert-success'
    if (type === 'error') return 'alert-danger'
    if (type === 'warning') return 'alert-warning'
    return 'alert-info'
  }

  if (items.length === 0) return null

  return (
    <div style={posStyle} className="d-flex flex-column gap-2">
      {items.map((t) => (
        <div key={t.id} className={`alert ${toClass(t.type)} shadow-sm mb-0`} role="alert" style={{ minWidth: 260, maxWidth: 360 }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

