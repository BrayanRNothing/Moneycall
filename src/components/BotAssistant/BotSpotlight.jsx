import React, { useEffect, useState } from 'react';
import { useBotStore } from '../../store/useBotStore';

const BotSpotlight = () => {
  const { currentStep, advanceStep } = useBotStore();
  const [targetRect, setTargetRect] = useState(null);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      setIsInteractive(false);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        // Scroll suave si el elemento no está en pantalla
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const tagName = el.tagName.toLowerCase();
        const interactive = 
          tagName === 'input' || 
          tagName === 'textarea' || 
          tagName === 'select' || 
          tagName === 'button' ||
          tagName === 'a' ||
          el.querySelector('input, textarea, select, button, a') !== null ||
          el.getAttribute('contenteditable') === 'true';
        setIsInteractive(interactive);
        
        setTimeout(() => {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
        }, 300); // Dar tiempo al scroll
      } else {
        setTargetRect(null);
        setIsInteractive(false);
      }
    };

    updateRect();
    
    // Escuchar redimensiones para recalcular
    window.addEventListener('resize', updateRect);
    // Observar DOM por si el elemento aparece tarde
    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateRect);
      observer.disconnect();
    };
  }, [currentStep]);

  if (!currentStep?.targetSelector || !targetRect) return null;

  const padding = 8; // Píxeles de respiro alrededor del botón resaltado

  return (
    <div 
        className="fixed inset-0 z-[9990]" 
        style={{ pointerEvents: currentStep.blockOtherClicks ? 'auto' : 'none' }} 
    >
        {/* Máscara oscura con "recorte" de luz */}
        <div 
           className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
           style={{
               boxShadow: `inset 0 0 0 9999px rgba(0, 0, 0, 0.65)`,
               clipPath: `polygon(
                   0% 0%, 
                   0% 100%, 
                   ${targetRect.left - padding}px 100%, 
                   ${targetRect.left - padding}px ${targetRect.top - padding}px, 
                   ${targetRect.right + padding}px ${targetRect.top - padding}px, 
                   ${targetRect.right + padding}px ${targetRect.bottom + padding}px, 
                   ${targetRect.left - padding}px ${targetRect.bottom + padding}px, 
                   ${targetRect.left - padding}px 100%, 
                   100% 100%, 
                   100% 0%
               )`
           }}
        />
        
        {/* Flecha indicadora flotante y rebotante apuntando al elemento */}
        <div 
           className="absolute pointer-events-none flex flex-col items-center justify-center animate-bounce z-[9999]"
           style={{
               top: Math.max(10, targetRect.top - padding - 55),
               left: Math.max(10, targetRect.left + (targetRect.width / 2) - 20),
               width: 40,
               height: 50,
           }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-indigo-400 filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.9)]">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v16.19l6.22-6.22a.75.75 0 111.06 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 111.06-1.06l6.22 6.22V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
        </div>

        {/* Área clickeable transparente justo encima del objetivo */}
        <div 
           className={`absolute rounded-xl border-[3px] border-indigo-400 animate-pulse ${
             isInteractive ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'
           }`}
           style={{
               top: targetRect.top - padding,
               left: targetRect.left - padding,
               width: targetRect.width + padding * 2,
               height: targetRect.height + padding * 2,
           }}
           onClick={() => {
               if (isInteractive) return;
               
               // Avisamos al bot que se completó
               advanceStep();
               
               // Simulamos el clic real en el elemento de abajo
               const el = document.querySelector(currentStep.targetSelector);
               if (el) el.click();
           }}
        />
    </div>
  );
};

export default BotSpotlight;
