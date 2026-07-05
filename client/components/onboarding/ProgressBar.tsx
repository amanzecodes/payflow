"use client";

interface ProgressBarProps {
  current: 1 | 2 | 3 | 4;
  onBack?: () => void;
}

export function ProgressBar({ current, onBack }: ProgressBarProps) {
  const totalSteps = 4;
  const progress = (current / totalSteps) * 100;
  const canGoBack = current > 1 && !!onBack;

  return (
    <div className="mb-8 px-6 py-4 border border-dashed border-gray-300 rounded-lg">
      <div className="flex items-center gap-3">
        {/* Back arrow */}
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Go to previous step"
          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Progress bar container */}
        <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicator */}
        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
          {current}/{totalSteps}
        </span>
      </div>
    </div>
  );
}
