import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBotStore } from '../../store/useBotStore';
import Typewriter from 'typewriter-effect';

const BotPanel = ({ position = 'right' }) => {
  const { isOpen, currentStep, verticalPosition, toggleVerticalPosition } = useBotStore();
  const [showOptions, setShowOptions] = useState(false);
  const [targetIsInput, setTargetIsInput] = useState(false);

  // Convierte markdown simple a HTML para el Typewriter
  const mdToHtml = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  // Reiniciamos las opciones cuando cambia el paso para darle tiempo al Typewriter de teclear
  useEffect(() => {
    setShowOptions(false);
  }, [currentStep?.id]);

  useEffect(() => {
    if (currentStep?.targetSelector) {
      const el = document.querySelector(currentStep.targetSelector);
      const isElInput = el && (
        el.tagName.toLowerCase() === 'input' || 
        el.tagName.toLowerCase() === 'textarea'
      );
      setTargetIsInput(!!isElInput);
    } else {
      setTargetIsInput(false);
    }
  }, [currentStep]);

  return (
    <AnimatePresence>
      {isOpen && currentStep && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: verticalPosition === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: verticalPosition === 'top' ? -20 : 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative w-[300px] md:w-[340px] z-50 pointer-events-auto"
        >
          {/* Globo de Cómic (Speech Bubble) */}
          <div className="bg-white rounded-[2rem] p-5 shadow-2xl border-2 border-indigo-100 relative">
            
            {/* Cola del globo apuntando hacia el avatar */}
            <div className={`absolute w-6 h-6 bg-white border-indigo-100 transform rotate-45 z-0 rounded-sm ${
              verticalPosition === 'top' 
                ? '-top-3 border-t-2 border-l-2' 
                : '-bottom-3 border-b-2 border-r-2'
            } ${position === 'left' ? 'left-8' : 'right-8'}`}></div>
            
            {/* Botón para alternar posición vertical (arriba / abajo) */}
            <button
              onClick={toggleVerticalPosition}
              className="absolute top-3 right-4 p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all z-20"
              title={verticalPosition === 'bottom' ? 'Mover arriba' : 'Mover abajo'}
            >
              {verticalPosition === 'bottom' ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            
            <div className="relative z-10">
              {/* Texto mecanografiado */}
              <div className="text-[13.5px] text-slate-700 font-medium leading-relaxed min-h-[40px] pr-6 [&_strong]:font-bold [&_strong]:text-indigo-700 [&_br]:block">
                <Typewriter
                  options={{
                    delay: 5, // Velocidad mucho más rápida
                    cursor: '',
                  }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString(mdToHtml(currentStep.text))
                      .callFunction(() => setShowOptions(true))
                      .start();
                  }}
                  key={currentStep.id} // Forza remonte al cambiar paso
                />
              </div>

              {/* Opciones (Aparecen tras escribir) */}
              {showOptions && currentStep.options && currentStep.options.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col gap-2 mt-4"
                >
                  {currentStep.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={option.action}
                      className={`w-full py-2.5 px-4 rounded-full text-[13px] font-bold transition-all active:scale-95 shadow-sm
                        ${idx === 0 
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md' 
                          : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
              
              {/* Loader para cuando espera acción del usuario (Spotlight) */}
              {showOptions && currentStep.targetSelector && (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="mt-4 flex items-center justify-center gap-2 text-[11px] text-indigo-500 font-bold bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100"
                >
                   <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                   </span>
                   {targetIsInput 
                     ? 'Presiona Tabulador al terminar...' 
                     : 'Esperando tu acción en pantalla...'
                   }
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BotPanel;
