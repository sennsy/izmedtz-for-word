import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Install izmedtzz Studio for offline standalone use"
        className={`flex items-center gap-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-[#002FA7] hover:text-[#002FA7] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs font-medium'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{compact ? 'Install' : 'Install Studio App'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#002FA7]" />
                <h3 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                  Install izmedtzz Standalone PWA
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                aria-label="Close install instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {isIOS ? (
                <>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    To install izmedtzz on iPhone or iPad:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Tap the <strong>Share</strong> button in the Safari toolbar.</li>
                    <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                    <li>Launch <strong>izmedtzz</strong> as a full-screen offline studio.</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Standalone PWA Mode Ready
                  </p>
                  <p>
                    All critical studio assets and the Service Worker are active. When running inside an embedded preview frame, open the application URL in a top-level browser tab and click the address bar <strong>Install</strong> icon (or browser menu → <strong>Install izmedtzz</strong>) to pin it to your OS dock or desktop.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-[#050505] dark:bg-white text-white dark:text-[#050505] text-xs font-semibold hover:bg-[#002FA7] dark:hover:bg-[#002FA7] dark:hover:text-white transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
