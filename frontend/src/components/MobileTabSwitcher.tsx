import { useState, useRef, useCallback, useEffect } from 'react';
import { X, MessageSquare, FileText } from 'lucide-react';
import type { TabData } from '@shared/types';

/**
 * MobileTabSwitcher - Bottom sheet for tab selection on mobile
 *
 * Features:
 * - Slides up from bottom with smooth animation
 * - Shows open agent chats and document tabs
 * - Swipe left to close tabs
 * - Tap to switch tabs
 * - Different icons for chat vs doc tabs
 * - Scrollable list for many tabs
 */

interface MobileTabSwitcherProps {
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Swipe threshold in pixels to trigger close action
const SWIPE_THRESHOLD = 80;

// Animation duration in milliseconds
const ANIMATION_DURATION = 200;

interface TabItemProps {
  tab: TabData;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

/**
 * TabItem - Individual tab with swipe-to-close functionality
 */
function TabItem({ tab, isActive, onSelect, onClose }: TabItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;

    // Only allow swiping left (negative direction)
    if (diff < 0) {
      setTranslateX(diff);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;

    if (translateX < -SWIPE_THRESHOLD) {
      // Trigger close animation
      setIsClosing(true);
      setTranslateX(-window.innerWidth);

      // Call onClose after animation
      setTimeout(() => {
        onClose();
      }, ANIMATION_DURATION);
    } else {
      // Snap back
      setTranslateX(0);
    }
  }, [translateX, onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const diff = e.clientX - startXRef.current;
      if (diff < 0) {
        setTranslateX(diff);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;

      if (translateX < -SWIPE_THRESHOLD) {
        setIsClosing(true);
        setTranslateX(-window.innerWidth);
        setTimeout(() => {
          onClose();
        }, ANIMATION_DURATION);
      } else {
        setTranslateX(0);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [translateX, onClose]);

  const handleClick = useCallback(() => {
    // Only trigger select if not dragging
    if (Math.abs(translateX) < 5) {
      onSelect();
    }
  }, [translateX, onSelect]);

  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClosing(true);
    setTranslateX(-window.innerWidth);
    setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION);
  }, [onClose]);

  // Calculate background color based on swipe distance
  const getDeleteBgOpacity = () => {
    if (translateX >= 0) return 0;
    const progress = Math.min(Math.abs(translateX) / SWIPE_THRESHOLD, 1);
    return progress * 0.5;
  };

  return (
    <div className="relative mb-2 overflow-hidden rounded-lg">
      {/* Delete indicator background */}
      <div
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6"
        style={{ opacity: getDeleteBgOpacity() }}
      >
        <X className="w-6 h-6 text-white" />
      </div>

      {/* Tab content */}
      <div
        ref={itemRef}
        role="button"
        tabIndex={0}
        className={`relative flex items-center gap-3 p-4 rounded-lg transition-colors cursor-pointer ${
          isActive
            ? 'bg-slate-700 text-slate-100'
            : 'bg-slate-900 text-slate-300 active:bg-slate-700 hover:bg-slate-800'
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDraggingRef.current ? 'none' : `transform ${ANIMATION_DURATION}ms ease-out`,
          opacity: isClosing ? 0 : 1,
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        {/* Tab type icon */}
        {tab.type === 'chat' ? (
          <MessageSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
        ) : (
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
        )}

        {/* Tab title */}
        <div className="flex-1 min-w-0">
          <span className="block truncate font-medium">{tab.title}</span>
          {tab.type === 'doc' && tab.filePath && (
            <span className="block text-xs text-slate-500 truncate">
              {tab.filePath}
            </span>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={handleCloseClick}
          className="p-2 hover:bg-slate-600 rounded-lg transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Close ${tab.title}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * MobileTabSwitcher - Main component
 */
export function MobileTabSwitcher({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  isOpen,
  onClose,
}: MobileTabSwitcherProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setSheetVisible(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Hide after animation completes
      const timer = setTimeout(() => {
        setSheetVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTabSelect = useCallback((tabId: string) => {
    onSelectTab(tabId);
    onClose();
  }, [onSelectTab, onClose]);

  if (!sheetVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Open tabs"
        className={`fixed inset-x-0 bottom-0 bg-slate-800 rounded-t-2xl z-50 lg:hidden max-h-[70vh] overflow-hidden flex flex-col transform transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle indicator for drag gesture hint */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 pt-1 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            Open Tabs
            {tabs.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({tabs.length})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close tab switcher"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tab list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {tabs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 mb-4">
                <MessageSquare className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No open tabs</p>
              <p className="text-sm text-slate-500 mt-1">
                Select an agent or document to get started
              </p>
            </div>
          ) : (
            <div className="p-3">
              {/* Swipe hint */}
              <p className="text-xs text-slate-500 mb-3 text-center">
                Swipe left to close a tab
              </p>

              {tabs.map((tab) => (
                <TabItem
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === activeTabId}
                  onSelect={() => handleTabSelect(tab.id)}
                  onClose={() => onCloseTab(tab.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom bg-slate-800" />
      </div>
    </>
  );
}

export default MobileTabSwitcher;
