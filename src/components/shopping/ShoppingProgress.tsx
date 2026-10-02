import { listProgress } from '@/lib/shopping/selectors'
import { ShoppingList } from '@/lib/shopping/types'

const ShoppingProgress = ({ list, compact = false }: { list: ShoppingList | null; compact?: boolean }) => {
  const { total, completed, remaining, percent } = listProgress(list)

  return (
    <div>
      <div className="flex justify-between items-baseline">
        <h2 className="text-base font-semibold">List progress</h2>
        <span className="font-mono text-[13px] text-muted">{completed} of {total}</span>
      </div>
      <div
        className="h-1.5 bg-[#e3e0d6] rounded-full mt-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% collected`}
      >
        <div className="h-full bg-forest rounded-full transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
      {!compact && (
        <div className="flex justify-between text-[12px] text-muted mt-2">
          <span>{percent}% collected</span>
          <span>{remaining} remaining</span>
        </div>
      )}
    </div>
  )
}

export default ShoppingProgress
