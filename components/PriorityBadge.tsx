import type { Priority } from "@/lib/types";
import { PRIORITY_META } from "@/lib/layers";
import { cn } from "@/lib/cn";

/** 優先度バッジ（高/中/低）。 */
export default function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-semibold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
