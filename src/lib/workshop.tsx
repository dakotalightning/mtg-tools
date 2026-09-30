import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'

type TWorkshopContext = {
  queue: string[]
  addToQueue: (item: string) => void
  clearQueue: () => void
  saved: string[]
  toggleSaved: (id: string) => void
  isSaved: (id: string) => boolean
  toast: (message: string) => void
  toastMessage: string | null
}

const WorkshopContext = createContext<TWorkshopContext>({
  queue: [],
  addToQueue: () => {},
  clearQueue: () => {},
  saved: [],
  toggleSaved: () => {},
  isSaved: () => false,
  toast: () => {},
  toastMessage: null,
})

const WorkshopProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toast = useCallback((message: string) => {
    setToastMessage(message)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToastMessage(null), 3200)
  }, [])

  const addToQueue = useCallback((item: string) => {
    setQueue((q) => [...q, item])
    toast(`${item} added to print queue`)
  }, [toast])

  const clearQueue = useCallback(() => setQueue([]), [])

  const toggleSaved = useCallback((id: string) => {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }, [])

  const isSaved = useCallback((id: string) => saved.includes(id), [saved])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <WorkshopContext.Provider
      value={{ queue, addToQueue, clearQueue, saved, toggleSaved, isSaved, toast, toastMessage }}
    >
      {children}
    </WorkshopContext.Provider>
  )
}

export default WorkshopProvider

export const useWorkshop = (): TWorkshopContext => useContext(WorkshopContext)
