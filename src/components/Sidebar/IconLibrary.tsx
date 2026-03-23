import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useIconStore } from '@/stores/iconStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useSubscription } from '@/context/SubscriptionContext';
import { useIconRenderer, generateIconDataUrl } from '@/hooks/useIconRenderer';
import { useToast } from '@/hooks/use-toast';
import type { IconData } from '@/types/editor';
import { useNavigate } from 'react-router-dom';

function IconCard({ icon }: { icon: IconData }) {
  const dataUrl = icon.svg_url;
  const addElement = useCanvasStore((s) => s.addElement);
  const elements = useCanvasStore((s) => s.elements);
  const trackUsedIcon = useIconStore((s) => s.trackUsedIcon);
  const { isFreeUser } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAdd = () => {
    // Check icon limit for free users
    if (isFreeUser()) {
      const iconCount = elements.filter((el) => el.type === 'icon').length;
      if (iconCount >= 20) {
        toast({
          title: 'Icon Limit Reached',
          description: 'Free plan allows maximum 20 icons per project. Upgrade to add more.',
          variant: 'destructive',
        });
        // Navigate to pricing page after a short delay
        setTimeout(() => navigate('/pricing'), 1500);
        return;
      }
    }

    const id = `icon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    addElement({
      id,
      type: 'icon',
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
      iconData: icon,
      svg_url: dataUrl,
    });
    trackUsedIcon(icon);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(icon));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <button
      onClick={handleAdd}
      draggable
      onDragStart={handleDragStart}
      className="group relative flex flex-col items-center gap-1.5 rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-border hover:bg-secondary/60 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {icon.attribution_required && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-attribution-badge text-[9px] text-foreground" title="Attribution required">
          ⚠️
        </span>
      )}
      {dataUrl ? (
        <img src={dataUrl} alt={icon.name} className="h-10 w-10 object-contain" loading="lazy" />
      ) : (
        <div className="h-10 w-10 rounded bg-muted animate-pulse" />
      )}
      <span className="text-[11px] leading-tight text-muted-foreground text-center line-clamp-2 group-hover:text-foreground transition-colors">
        {icon.name}
      </span>
    </button>
  );
}

export default function IconLibrary() {
  const {
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    attributionFilter, setAttributionFilter,
    getFilteredIcons, getCategories, loading,
  } = useIconStore();

  const filteredIcons = getFilteredIcons();
  const categories = getCategories();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex h-full w-64 flex-col border-r border-panel-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Icons</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`rounded p-1 transition-colors hover:bg-secondary ${showFilters ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-2 border-b border-panel-border px-3 pb-2.5 animate-fade-in">
          {/* Attribution filter */}
          <div className="flex gap-1">
            {(['all', 'free', 'attribution'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAttributionFilter(f)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  attributionFilter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {f === 'all' ? 'All' : f === 'free' ? 'Free' : '© Required'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-1 overflow-x-auto px-3 py-1.5 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Icons grid */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {loading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredIcons.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">No icons found</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filteredIcons.map((icon) => (
              <IconCard key={icon.id} icon={icon} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-panel-border px-3 py-2">
        <p className="text-[10px] text-muted-foreground text-center">
          {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
