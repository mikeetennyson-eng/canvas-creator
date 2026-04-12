import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

interface EditorTourProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  actionHint?: string;
  requiresAction?: boolean;
}

const STEPS: TourStep[] = [
  {
    id: 'icons',
    title: 'Add Your First Icon',
    description:
      'This is your icon library. You can drag and drop an icon to the canvas, or simply click it to place it.',
    targetSelector: '[data-tour="icon-library"]',
    actionHint: 'Try adding at least one icon to continue.',
    requiresAction: true,
  },
  {
    id: 'shape-tool',
    title: 'Use Shape Tools',
    description:
      'Now choose Rectangle from the action tools and click on the canvas to place a shape.',
    targetSelector: '[data-tour="tool-rect"]',
    actionHint: 'Add one rectangle to continue.',
    requiresAction: true,
  },
  {
    id: 'properties',
    title: 'Edit From Properties',
    description:
      'Select a shape on the canvas to open the Properties panel. You can change color, size, position, and even resize from transformer handles.',
    targetSelector: '[data-tour="properties-panel"]',
    actionHint: 'Select a shape on canvas to continue.',
    requiresAction: true,
  },
  {
    id: 'save',
    title: 'Save Progress',
    description:
      'Use Save anytime. Your work is also auto-saved every 30 seconds while editing.',
    targetSelector: '[data-tour="save-button"]',
  },
  {
    id: 'download',
    title: 'Download PNG',
    description:
      'Click PNG to download the full canvas as an image.',
    targetSelector: '[data-tour="download-png-button"]',
  },
];

export default function EditorTour({ open, onClose, onComplete }: EditorTourProps) {
  const { elements, selectedIds } = useCanvasStore();
  const [showPrompt, setShowPrompt] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const initialIconCountRef = useRef(0);
  const initialRectCountRef = useRef(0);

  const currentStep = STEPS[stepIndex];

  const hasAddedIcon = useMemo(() => {
    const currentIconCount = elements.filter((el) => el.type === 'icon').length;
    return currentIconCount > initialIconCountRef.current;
  }, [elements]);

  const hasAddedRectangle = useMemo(() => {
    const currentRectCount = elements.filter((el) => el.type === 'shape' && el.shapeType === 'rect').length;
    return currentRectCount > initialRectCountRef.current;
  }, [elements]);

  const hasSelectedShape = useMemo(() => {
    if (selectedIds.length !== 1) return false;
    const selected = elements.find((el) => el.id === selectedIds[0]);
    return !!selected && selected.type === 'shape';
  }, [elements, selectedIds]);

  const canAdvance = useMemo(() => {
    if (!currentStep?.requiresAction) return true;
    if (currentStep.id === 'icons') return hasAddedIcon;
    if (currentStep.id === 'shape-tool') return hasAddedRectangle;
    if (currentStep.id === 'properties') return hasSelectedShape;
    return true;
  }, [currentStep, hasAddedIcon, hasAddedRectangle, hasSelectedShape]);

  useEffect(() => {
    if (!open) return;

    initialIconCountRef.current = elements.filter((el) => el.type === 'icon').length;
    initialRectCountRef.current = elements.filter((el) => el.type === 'shape' && el.shapeType === 'rect').length;
    setShowPrompt(true);
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || showPrompt) return;

    const updateTargetRect = () => {
      const node = document.querySelector(currentStep.targetSelector);
      if (!node) {
        setTargetRect(null);
        return;
      }
      setTargetRect(node.getBoundingClientRect());
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [open, showPrompt, currentStep]);

  if (!open) return null;

  const endTour = () => {
    onComplete();
    onClose();
  };

  const skipTour = () => {
    onComplete();
    onClose();
  };

  if (showPrompt) {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60">
        <div className="w-[92vw] max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
          <h3 className="text-lg font-semibold text-foreground">Take a quick tour?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We will walk you through adding icons, drawing shapes, editing properties, saving, and downloading your canvas.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={skipTour}
              className="rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
            >
              Skip
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fallbackCard = (
    <div className="fixed left-1/2 top-6 z-[1202] w-[92vw] max-w-md -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Step {stepIndex + 1} of {STEPS.length}
      </p>
      <h4 className="mt-1 text-base font-semibold text-foreground">{currentStep.title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{currentStep.description}</p>
      {currentStep.actionHint && !canAdvance && (
        <p className="mt-2 text-xs font-medium text-primary">{currentStep.actionHint}</p>
      )}
      <div className="mt-4 flex justify-between">
        <button onClick={skipTour} className="text-sm text-muted-foreground hover:text-foreground">
          Skip tour
        </button>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <button
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              className="rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (stepIndex === STEPS.length - 1) {
                endTour();
                return;
              }
              setStepIndex((prev) => prev + 1);
            }}
            disabled={!canAdvance}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!targetRect) return fallbackCard;

  const padding = 8;
  const highlight = {
    left: Math.max(0, targetRect.left - padding),
    top: Math.max(0, targetRect.top - padding),
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  const cardWidth = Math.min(380, window.innerWidth - 24);
  const preferredTop = highlight.top + highlight.height + 12;
  const showAbove = preferredTop + 220 > window.innerHeight;
  const cardTop = showAbove ? Math.max(12, highlight.top - 232) : preferredTop;
  const cardLeft = Math.min(
    Math.max(12, highlight.left + highlight.width / 2 - cardWidth / 2),
    window.innerWidth - cardWidth - 12
  );

  return (
    <div className="fixed inset-0 z-[1200]">
      <div
        className="pointer-events-none fixed z-[1201] rounded-lg border-2 border-primary"
        style={{
          left: highlight.left,
          top: highlight.top,
          width: highlight.width,
          height: highlight.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.56)',
        }}
      />

      <div
        className="fixed z-[1202] rounded-xl border border-border bg-card p-4 shadow-xl"
        style={{
          left: cardLeft,
          top: cardTop,
          width: cardWidth,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <h4 className="mt-1 text-base font-semibold text-foreground">{currentStep.title}</h4>
        <p className="mt-2 text-sm text-muted-foreground">{currentStep.description}</p>
        {currentStep.actionHint && !canAdvance && (
          <p className="mt-2 text-xs font-medium text-primary">{currentStep.actionHint}</p>
        )}

        <div className="mt-4 flex justify-between">
          <button onClick={skipTour} className="text-sm text-muted-foreground hover:text-foreground">
            Skip tour
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (stepIndex === STEPS.length - 1) {
                  endTour();
                  return;
                }
                setStepIndex((prev) => prev + 1);
              }}
              disabled={!canAdvance}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
