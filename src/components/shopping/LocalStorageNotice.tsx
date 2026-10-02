import { useShoppingLists } from '@/lib/shopping/ShoppingListProvider'

/**
 * Unobtrusive "stored on this device" line, plus prominent banners when
 * storage is unavailable or saved data had to be recovered.
 */
const LocalStorageNotice = ({ compact = false }: { compact?: boolean }) => {
  const { storageError, recoveryMessage, dismissRecovery } = useShoppingLists()

  return (
    <div>
      {recoveryMessage && (
        <div role="alert" className="mb-3 bg-[#f6e9d6] border border-[#e0c9a2] text-[#6b4e23] rounded-md px-4 py-3 text-[13px] flex justify-between items-start gap-3">
          <span>{recoveryMessage}</span>
          <button onClick={dismissRecovery} aria-label="Dismiss" className="shrink-0 font-bold">×</button>
        </div>
      )}
      {storageError && (
        <div role="alert" className="mb-3 bg-[#f4ddd8] border border-[#e0b3a9] text-[#7a3b30] rounded-md px-4 py-3 text-[13px]">
          {storageError}
        </div>
      )}
      {!compact && (
        <p className="text-[12px] text-muted">Saved on this device only. Cloud sync will be added later.</p>
      )}
    </div>
  )
}

export default LocalStorageNotice
