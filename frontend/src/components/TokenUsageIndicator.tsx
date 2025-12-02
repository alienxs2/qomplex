import { useState, useCallback, useMemo } from 'react';

/**
 * TokenUsageIndicator Props
 *
 * Based on design.md TokenUsageIndicator interface:
 * - inputTokens: number
 * - outputTokens: number
 * - totalTokens: number
 * - warningThreshold?: number (default 120000)
 */
export interface TokenUsageProps {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  warningThreshold?: number; // default 120000
  cost?: number; // USD cost if available
  showProgressBar?: boolean; // optional progress bar
  className?: string;
}

/**
 * Format large numbers with K suffix for thousands
 * e.g., 12500 -> "12.5K", 1234 -> "1.2K", 500 -> "500"
 */
function formatTokenCount(count: number): string {
  if (count >= 1000) {
    const thousands = count / 1000;
    // Use 1 decimal place for cleaner display
    if (thousands >= 100) {
      return `${Math.round(thousands)}K`;
    }
    return `${thousands.toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format cost in USD
 * e.g., 0.0025 -> "$0.0025", 1.5 -> "$1.50"
 */
function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * TokenUsageIndicator - Display token usage with warning at 120K
 *
 * Features:
 * - Compact token count display (e.g., "12.5K tokens")
 * - Yellow/orange warning color when >= warning threshold
 * - Hover/tap shows tooltip with breakdown (input, output, cost)
 * - Optional progress bar visualization
 * - Mobile-friendly tap to show tooltip
 *
 * Requirements: REQ-7 (Token Usage Monitoring with warning at 120K)
 *
 * Reference: design.md TokenUsageIndicator interface, clipendra Header usage pattern
 */
export function TokenUsageIndicator({
  inputTokens,
  outputTokens,
  totalTokens,
  warningThreshold = 120000,
  cost,
  showProgressBar = false,
  className = '',
}: TokenUsageProps) {
  // Tooltip visibility state for mobile tap support
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  /**
   * Determine if we're in warning state (>= threshold)
   */
  const isWarning = totalTokens >= warningThreshold;

  /**
   * Calculate progress percentage for optional progress bar
   * Cap at 100% even if over threshold
   */
  const progressPercentage = useMemo(() => {
    return Math.min((totalTokens / warningThreshold) * 100, 100);
  }, [totalTokens, warningThreshold]);

  /**
   * Formatted token display
   */
  const formattedTotal = formatTokenCount(totalTokens);
  const formattedInput = formatTokenCount(inputTokens);
  const formattedOutput = formatTokenCount(outputTokens);

  /**
   * Handle click/tap to toggle tooltip (mobile support)
   */
  const handleClick = useCallback(() => {
    setIsTooltipVisible((prev) => !prev);
  }, []);

  /**
   * Handle mouse enter (desktop hover)
   */
  const handleMouseEnter = useCallback(() => {
    setIsTooltipVisible(true);
  }, []);

  /**
   * Handle mouse leave (desktop hover)
   */
  const handleMouseLeave = useCallback(() => {
    setIsTooltipVisible(false);
  }, []);

  /**
   * Close tooltip when clicking outside (for mobile)
   */
  const handleBlur = useCallback(() => {
    // Small delay to allow click events to process
    setTimeout(() => setIsTooltipVisible(false), 150);
  }, []);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
    >
      {/* Main Token Display - Compact */}
      <button
        type="button"
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
          transition-colors duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${
            isWarning
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'
          }
        `}
        aria-label={`Token usage: ${formattedTotal} tokens. ${isWarning ? 'Warning: approaching context limit.' : ''} Tap for details.`}
        aria-expanded={isTooltipVisible}
      >
        {/* Token Icon */}
        <svg
          className={`w-3.5 h-3.5 ${isWarning ? 'text-yellow-600' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>

        {/* Token Count */}
        <span>{formattedTotal} tokens</span>

        {/* Warning Icon when over threshold */}
        {isWarning && (
          <svg
            className="w-3.5 h-3.5 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Optional Progress Bar */}
      {showProgressBar && (
        <div className="ml-2 w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isWarning ? 'bg-yellow-500' : 'bg-primary-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={totalTokens}
            aria-valuemin={0}
            aria-valuemax={warningThreshold}
            aria-label={`Token usage progress: ${Math.round(progressPercentage)}%`}
          />
        </div>
      )}

      {/* Tooltip with Breakdown */}
      {isTooltipVisible && (
        <div
          className={`
            absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2
            min-w-[180px] p-3 rounded-lg shadow-lg border
            bg-white text-gray-800 text-xs
            animate-in fade-in slide-in-from-top-1 duration-150
          `}
          role="tooltip"
        >
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-l border-t rotate-45" />

          {/* Header with warning message if applicable */}
          {isWarning && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-yellow-200 text-yellow-700">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Context limit approaching</span>
            </div>
          )}

          {/* Token Breakdown */}
          <div className="space-y-1.5">
            {/* Input Tokens */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Input:</span>
              <span className="font-medium">{formattedInput} tokens</span>
            </div>

            {/* Output Tokens */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Output:</span>
              <span className="font-medium">{formattedOutput} tokens</span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total:</span>
              <span className={`font-semibold ${isWarning ? 'text-yellow-700' : 'text-gray-800'}`}>
                {formattedTotal} tokens
              </span>
            </div>

            {/* Cost if available */}
            {cost !== undefined && cost > 0 && (
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <span className="text-gray-500">Cost:</span>
                <span className="font-medium text-green-600">{formatCost(cost)}</span>
              </div>
            )}

            {/* Threshold info */}
            <div className="pt-2 mt-2 border-t border-gray-100 text-[10px] text-gray-400">
              Warning threshold: {formatTokenCount(warningThreshold)} tokens
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenUsageIndicator;
