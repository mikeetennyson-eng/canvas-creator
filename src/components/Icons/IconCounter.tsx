import { useCanvasStore } from '@/stores/canvasStore';
import { useSubscription } from '@/context/SubscriptionContext';
import { AlertCircle, Zap } from 'lucide-react';

export default function IconCounter() {
  const elements = useCanvasStore((s) => s.elements);
  const { subscription, isFreeUser } = useSubscription();

  const iconCount = elements.filter((el) => el.type === 'icon').length;
  const maxIcons = isFreeUser() ? 10 : Infinity;
  const isNearLimit = isFreeUser() && iconCount >= 8;
  const isAtLimit = isFreeUser() && iconCount >= 10;

  if (!isFreeUser()) {
    return null; // Don't show for professional users
  }

  return (
    <div
      className={`fixed bottom-6 right-6 rounded-lg border px-4 py-3 flex items-center gap-3 z-40 ${
        isAtLimit
          ? 'bg-red-50 border-red-300 shadow-lg'
          : isNearLimit
          ? 'bg-yellow-50 border-yellow-300'
          : 'bg-card border-border'
      }`}
    >
      {isAtLimit && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
      {isNearLimit && !isAtLimit && <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
      {!isNearLimit && <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />}

      <div className="flex-1">
        <p className={`text-sm font-semibold ${
          isAtLimit
            ? 'text-red-900'
            : isNearLimit
            ? 'text-yellow-900'
            : 'text-foreground'
        }`}>
          Icons: {iconCount}/{maxIcons}
        </p>
        {isAtLimit && (
          <p className="text-xs text-red-600">Limit reached. Upgrade to add more.</p>
        )}
        {isNearLimit && !isAtLimit && (
          <p className="text-xs text-yellow-600">{maxIcons - iconCount} icons remaining</p>
        )}
      </div>
    </div>
  );
}
