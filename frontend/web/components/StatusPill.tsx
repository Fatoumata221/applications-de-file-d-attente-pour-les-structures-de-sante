export type QueueLevel = "faible" | "moderee" | "longue";

const dotClass: Record<QueueLevel, string> = {
  faible: "bg-primary",
  moderee: "bg-accent",
  longue: "bg-danger",
};

export function queueLevelFromCount(count: number): QueueLevel {
  if (count <= 3) return "faible";
  if (count <= 8) return "moderee";
  return "longue";
}

type Props = {
  level: QueueLevel;
  /** Nombre de patients actuellement en attente. Si fourni, affiché en chiffres plutôt qu'un simple libellé. */
  waiting?: number;
  /** Temps d'attente estimé en minutes. */
  estimatedMinutes?: number;
};

export default function StatusPill({ level, waiting, estimatedMinutes }: Props) {
  const label =
    waiting !== undefined
      ? waiting === 0
        ? "Aucune attente"
        : `${waiting} en attente${
            estimatedMinutes !== undefined ? ` · ~${estimatedMinutes} min` : ""
          }`
      : level === "faible"
        ? "File courte"
        : level === "moderee"
          ? "File modérée"
          : "File longue";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass[level]}`} />
      {label}
    </span>
  );
}
