import { X, Copy, Download, ExternalLink } from 'lucide-react';
import { useIconStore } from '@/stores/iconStore.js';
import { toast } from 'sonner';

export default function AttributionModal({ open, onClose }) {
  const usedIcons = useIconStore((s) => s.usedIcons);

  if (!open) return null;

  const handleCopy = async () => {
    if (usedIcons.length === 0) return;
    const text = usedIcons.map((i) => `${i.name} by ${i.author} (${i.license})`).join('\n');
    await navigator.clipboard.writeText(text);
    toast.success('Attribution text copied!');
  };

  const handleDownload = () => {
    if (usedIcons.length === 0) return;
    const text = usedIcons.map((i) => `${i.name} by ${i.author} (${i.license})`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
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
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Used Icons ({usedIcons.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {usedIcons.map((icon) => (
                  <li key={icon.id} className="flex items-start justify-between rounded-lg border border-panel-border bg-background p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{icon.name}</p>
                      <p className="text-xs text-muted-foreground">
                        by <span className="font-medium">{icon.author}</span> · License: {icon.license}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex gap-2 border-t border-panel-border pt-4">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Text
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary active:scale-[0.97]"
              >
                <Download className="h-3.5 w-3.5" />
                .txt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
