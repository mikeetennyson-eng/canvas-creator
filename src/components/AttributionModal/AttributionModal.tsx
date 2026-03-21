import { X, Copy, Download, ExternalLink } from 'lucide-react';
import { useIconStore } from '@/stores/iconStore';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AttributionModal({ open, onClose }: Props) {
  const usedIcons = useIconStore((s) => s.usedIcons);
  const getAttributionText = useIconStore((s) => s.getAttributionText);

  if (!open) return null;

  const attributionRequired = usedIcons.filter((i) => i.attribution_required);
  const freeIcons = usedIcons.filter((i) => !i.attribution_required);
  const attrText = getAttributionText();

  const handleCopy = async () => {
    if (!attrText) return;
    await navigator.clipboard.writeText(attrText);
    toast.success('Attribution text copied!');
  };

  const handleDownload = () => {
    if (!attrText) return;
    const blob = new Blob([attrText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'attribution.txt';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-xl border border-panel-border bg-card p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-foreground">📜 Attributions</h2>
        <p className="mt-1 text-sm text-muted-foreground">Icons used in this diagram</p>

        {usedIcons.length === 0 ? (
          <div className="mt-6 rounded-lg bg-muted p-6 text-center">
            <p className="text-sm text-muted-foreground">No icons have been used yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add icons from the library to see attribution info here.</p>
          </div>
        ) : (
          <>
            {/* Attribution required */}
            {attributionRequired.length > 0 && (
              <div className="mt-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-attribution-badge">
                  <span>⚠️</span> Attribution Required ({attributionRequired.length})
                </h3>
                <ul className="mt-2 space-y-2">
                  {attributionRequired.map((icon) => (
                    <li key={icon.id} className="flex items-start justify-between rounded-lg border border-panel-border bg-background p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{icon.name}</p>
                        <p className="text-xs text-muted-foreground">
                          by <span className="font-medium">{icon.author}</span> · License: {icon.license}
                        </p>
                      </div>
                      <a
                        href={icon.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Source"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Free icons */}
            {freeIcons.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
                  ✓ Free / No Attribution ({freeIcons.length})
                </h3>
                <ul className="mt-2 space-y-1">
                  {freeIcons.map((icon) => (
                    <li key={icon.id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground">
                      <span>{icon.name}</span>
                      <span className="text-xs">{icon.license}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {attributionRequired.length > 0 && (
              <div className="mt-5 flex gap-2 border-t border-panel-border pt-4">
                <button
                  onClick={handleCopy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Attribution Text
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary active:scale-[0.97]"
                >
                  <Download className="h-3.5 w-3.5" />
                  .txt
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
