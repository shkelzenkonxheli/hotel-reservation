export default function RoomsEmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <p className="text-lg font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--public-muted)]">{subtitle}</p>
      {onAction ? (
        <button type="button" className="btn btn-outline btn-sm mt-5" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
