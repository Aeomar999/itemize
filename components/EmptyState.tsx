import { InboxIcon } from "@heroicons/react/24/outline"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
      <InboxIcon className="w-8 h-8 text-slate-300 mb-4" />
      <h3 className="text-base font-medium text-slate-900">No records</h3>
      <p className="mt-1 text-slate-500 text-sm">
        Upload product images to extract their attributes.
      </p>
    </div>
  )
}
