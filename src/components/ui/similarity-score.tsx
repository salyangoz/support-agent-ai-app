import { tokens } from '@/lib/design-tokens'

interface SimilarityScoreProps {
  score: number | null | undefined
}

const { success, warning, error } = tokens.colors.semantic

function bucket(score: number) {
  if (score >= 0.85) return { color: success, label: 'High match' }
  if (score >= 0.5) return { color: warning, label: 'Edited' }
  return { color: error, label: 'Rewritten' }
}

export function SimilarityScore({ score }: SimilarityScoreProps) {
  if (score == null) {
    return (
      <span
        className="inline-flex items-center rounded-lg border border-dashed px-2 py-0.5 text-xs text-muted-foreground"
        title="No human reply has been compared yet."
      >
        No score
      </span>
    )
  }

  const { color, label } = bucket(score)
  const pct = Math.round(score * 100)

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-bold"
      style={{ backgroundColor: `${color}20`, color, borderColor: 'transparent' }}
      title={`${label}: ${pct}% of the draft matched the agent's reply.`}
    >
      <span>{pct}%</span>
      <span className="font-medium opacity-80">{label}</span>
    </span>
  )
}
