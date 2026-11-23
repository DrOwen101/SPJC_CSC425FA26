import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PopOutWindowProps {
  popupWindow: Window
  title: string
  onClose: () => void
  children: ReactNode
}

export function PopOutWindow({ popupWindow, title, onClose, children }: PopOutWindowProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }

    const popupDocument = popupWindow.document
    popupDocument.title = title
    const copiedHeadNodes = Array.from(
      document.head.querySelectorAll('link[rel="stylesheet"], style, meta[name="viewport"]'),
      (node) => node.cloneNode(true),
    )
    popupDocument.head.append(...copiedHeadNodes)

    const popupContainer = popupDocument.createElement('div')
    popupDocument.body.appendChild(popupContainer)
    setContainer(popupContainer)

    const handleBeforeUnload = () => onClose()
    popupWindow.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      popupWindow.removeEventListener('beforeunload', handleBeforeUnload)
      popupContainer.remove()
      copiedHeadNodes.forEach((node) => node.parentNode?.removeChild(node))
      closeTimer.current = window.setTimeout(() => {
        if (!popupWindow.closed) popupWindow.close()
      }, 0)
    }
  }, [popupWindow, title, onClose])

  if (!container) return null
  return createPortal(children, container)
}
