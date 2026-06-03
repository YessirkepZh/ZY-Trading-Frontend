import { STATUS_COLORS, STATUS_LABELS } from '../utils/constants';
import type { DealStatus } from '../types';

interface DealStatusBadgeProps {
  status: DealStatus;
}

export default function DealStatusBadge({ status }: DealStatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? '#666';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  );
}
