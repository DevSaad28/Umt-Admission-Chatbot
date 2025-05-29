import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, X } from "lucide-react"

export const ToastContainer = ({ children }) => {
  return <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2">{children}</div>
}

export const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onClose && onClose()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const variants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-green-500" size={20} />
      case "error":
        return <XCircle className="text-red-500" size={20} />
      case "loading":
        return <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
      default:
        return null
    }
  }

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "loading":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`px-5 py-4 rounded-lg shadow-md border ${getBgColor()} flex items-center min-w-[320px] max-w-md`}
        >
          <div className="mr-3">{getIcon()}</div>
          <div className="flex-1 text-sm font-medium">{message}</div>
          <button onClick={() => setVisible(false)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = "success", duration = 3000) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type, duration }])
    return id
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message, duration = 3000) => addToast(message, "success", duration)
  const error = (message, duration = 3000) => addToast(message, "error", duration)
  const loading = (message, duration = 10000) => {
    const id = addToast(message, "loading", duration)
    return id
  }

  const updateToast = (id, message, type, duration = 3000) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, message, type, duration } : toast)))
    return id
  }

  const ToastList = () => (
    <ToastContainer>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContainer>
  )

  return { success, error, loading, updateToast, removeToast, ToastList }
}
