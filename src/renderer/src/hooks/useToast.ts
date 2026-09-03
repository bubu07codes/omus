import { useState, useCallback } from 'react'
import { ToastMessage } from '../types'

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (
      title: string,
      message?: string,
      type: 'success' | 'info' | 'error' = 'info',
      duration = 3200
    ) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const newToast: ToastMessage = { id, title, message, type, duration }
      setToasts((prev) => [...prev.slice(-4), newToast])

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
