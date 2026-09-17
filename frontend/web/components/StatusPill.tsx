export type QueueLevel = "faible" | "moderee" | "longue";

const levelStyles: Record<QueueLevel, { dot: string; label: string }> = {
  faible: { dot: "bg-primary", label: "File courte" },
  moderee: { dot: "bg-accent", label: "File modérée" },
  longue: { dot: "bg-danger", label: "File longue" },
};

export function queueLevelFromCount(count: number): QueueLevel {
  if (count <= 3) return "faible";
  if (count <= 8) return "moderee";
  return "longue";
}

export default function StatusPill({ level }: { level: QueueLevel }) {
  const style = levelStyles[level];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
      <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
