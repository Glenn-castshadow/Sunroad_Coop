import { ClaimStatus, STATUS_META } from "@/app/data/mockData";

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  const { label, color, bg } = STATUS_META[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${color} ${bg}`}>
      {label}
    </span>
  );
}
