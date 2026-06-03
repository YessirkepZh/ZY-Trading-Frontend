interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="bg-surface rounded-lg p-4 border border-border flex flex-col gap-1">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p
        className="text-2xl font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
