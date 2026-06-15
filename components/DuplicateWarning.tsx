import { ExclamationTriangleIcon } from "@heroicons/react/24/solid"

interface Props {
  duplicateStatus?: "exact" | "possible"
}

export function DuplicateWarning({ duplicateStatus }: Props) {
  if (!duplicateStatus) return null

  const isExact = duplicateStatus === "exact"
  
  return (
    <div className={`mt-1.5 flex items-start gap-1.5 text-xs font-medium ${
      isExact ? "text-red-600" : "text-amber-600"
    }`}>
      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
      <span>
        {isExact ? "Exact duplicate" : "Possible duplicate"}
      </span>
    </div>
  )
}
