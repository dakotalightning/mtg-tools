import { useShoppingLists } from '@/lib/shopping/ShoppingListProvider'
import { ShoppingStore } from '@/lib/shopping/store'
import { BTN, BTN_PRIMARY, cx } from '@/lib/ui'
import { useWorkshop } from '@/lib/workshop'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'

const BackupImportDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { importEnvelope } = useShoppingLists()
  const { toast } = useWorkshop()
  const [parsed, setParsed] = useState<unknown>(null)
  const [preview, setPreview] = useState<{ lists: number; items: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [confirmingReplace, setConfirmingReplace] = useState(false)

  const reset = () => { setParsed(null); setPreview(null); setError(null); setFileName(''); setConfirmingReplace(false) }

  const onFile = async (file: File) => {
    reset()
    setFileName(file.name)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const described = ShoppingStore.describeEnvelope(json)
      if (!described) { setError('This file is not a valid Card Cloud backup.'); return }
      setParsed(json)
      setPreview(described)
    } catch {
      setError('Could not read that file as JSON.')
    }
  }

  const doImport = (mode: 'merge' | 'replace') => {
    if (!parsed) return
    const counts = importEnvelope(parsed, mode)
    toast(`${mode === 'replace' ? 'Replaced with' : 'Merged'} ${counts.lists} list${counts.lists === 1 ? '' : 's'} (${counts.items} cards)`)
    reset(); onClose()
  }

  return (
    <Transition show={open} as={Fragment} afterLeave={reset}>
      <Dialog onClose={onClose} className="relative z-20">
        <Transition.Child as={Fragment} enter="transition-opacity" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-[#10212899]" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 flex justify-center items-center p-4 max-[760px]:items-end max-[760px]:p-0">
          <Dialog.Panel className="bg-paper border border-line rounded-xl w-full max-w-[460px] p-5 max-[760px]:rounded-b-none max-[760px]:max-w-none">
            <Dialog.Title className="text-base font-semibold">Restore backup</Dialog.Title>
            <p className="text-[13px] text-muted mb-4">Choose a previously exported JSON backup.</p>

            <label className={cx(BTN, 'inline-flex cursor-pointer')}>
              Choose file…
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
              />
            </label>
            {fileName && <span className="ml-2 text-[13px] text-muted">{fileName}</span>}

            {error && <p role="alert" className="mt-3 text-[13px] text-[#7a3b30]">{error}</p>}

            {preview && (
              <div className="mt-4 border border-line rounded-md p-3 bg-[#faf8f0]">
                <p className="text-[13px]">This backup contains <b>{preview.lists}</b> list{preview.lists === 1 ? '' : 's'} and <b>{preview.items}</b> card{preview.items === 1 ? '' : 's'}.</p>
                {confirmingReplace && (
                  <p className="text-[13px] text-[#7a3b30] mt-2">Replace will remove your current lists on this device. Continue?</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={onClose} className={BTN}>Cancel</button>
              {preview && !confirmingReplace && (
                <>
                  <button onClick={() => setConfirmingReplace(true)} className={BTN}>Replace…</button>
                  <button onClick={() => doImport('merge')} className={BTN_PRIMARY}>Merge</button>
                </>
              )}
              {preview && confirmingReplace && (
                <>
                  <button onClick={() => setConfirmingReplace(false)} className={BTN}>Back</button>
                  <button onClick={() => doImport('replace')} className={cx(BTN_PRIMARY, '!bg-[#7a3b30] !border-[#7a3b30]')}>Replace all</button>
                </>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  )
}

export default BackupImportDialog
