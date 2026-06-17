import { cn } from "@/lib/utils"

export function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === undefined) return null

  let colorClass = "bg-emerald-50 text-emerald-700"
  if (confidence < 0.6) {
    colorClass = "bg-red-50 text-red-700"
  } else if (confidence < 0.8) {
    colorClass = "bg-amber-50 text-amber-700"
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border whitespace-nowrap",
      confidence >= 0.8 ? "border-emerald-200/50" : confidence >= 0.6 ? "border-amber-200/50" : "border-red-200/50",
      colorClass
    )}>
      {Math.round(confidence * 100)}% Conf
    </span>
  )
}
