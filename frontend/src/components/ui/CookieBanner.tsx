'use client';

import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookies_accepted');
    if (!accepted) setVisible(true);
  }, []);

  function handleAccept() {
    localStorage.setItem('cookies_accepted', 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <p className="text-sm text-slate-300">
            Esta plataforma utiliza cookies tecnicas necesarias para su funcionamiento.
            No utilizamos cookies de seguimiento ni publicitarias.{' '}
            <a href="/cookies" className="text-blue-400 hover:underline">Mas informacion</a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all min-h-[44px]"
          >
            Aceptar
          </button>
          <a
            href="/privacy"
            className="px-4 py-2 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors min-h-[44px] flex items-center"
          >
            Privacidad
          </a>
        </div>
      </div>
    </div>
  );
}
