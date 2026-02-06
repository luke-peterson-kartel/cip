import type { AssetProductionStage } from '@/types'
import { cn } from '@/lib/cn'

const productionStages: Array<{ value: AssetProductionStage; label: string }> = [
  { value: 'ANIMATIC', label: 'Animatic' },
  { value: 'ROUGH_CUT', label: 'Rough Cut' },
  { value: 'FINE_CUT', label: 'Fine Cut' },
  { value: 'LAST_LOOKS', label: 'Last Looks' },
  { value: 'FINAL', label: 'Final' },
]

interface ProductionProgressBarProps {
  currentStage: AssetProductionStage
  onStageChange: (stage: AssetProductionStage) => void
}

export function ProductionProgressBar({ currentStage, onStageChange }: ProductionProgressBarProps) {
  const currentIndex = productionStages.findIndex(s => s.value === currentStage)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Production Progress</span>
        <span>{currentIndex + 1} of {productionStages.length}</span>
      </div>
      <div className="flex gap-1">
        {productionStages.map((stage, index) => {
          const isActive = index === currentIndex
          const isCompleted = index < currentIndex
          const isFuture = index > currentIndex

          return (
            <button
              key={stage.value}
              onClick={() => onStageChange(stage.value)}
              className={cn(
                "flex-1 h-2 rounded-full transition-all hover:opacity-80",
                isCompleted && "bg-purple-500",
                isActive && "bg-purple-400",
                isFuture && "bg-gray-200"
              )}
              title={stage.label}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs">
        {productionStages.map((stage, index) => (
          <button
            key={stage.value}
            onClick={() => onStageChange(stage.value)}
            className={cn(
              "flex-1 text-center transition-colors hover:text-purple-600",
              index === currentIndex ? "text-purple-600 font-medium" : "text-gray-500"
            )}
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  )
}
