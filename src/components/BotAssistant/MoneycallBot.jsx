import React, { useRef, useState, useEffect } from 'react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import BotAvatar from './BotAvatar';
import BotPanel from './BotPanel';
import BotSpotlight from './BotSpotlight';
import { useMoneycallBotLogic } from '../../hooks/useMoneycallBotLogic';
import { useBotStore } from '../../store/useBotStore';

const MoneycallBot = () => {
  useMoneycallBotLogic();
  const { currentStep, verticalPosition, setVerticalPosition } = useBotStore();
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();
  const [position, setPosition] = useState('right');

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Mover el bot arriba únicamente en la sección de fuente del prospecto
  useEffect(() => {
    if (currentStep?.id === 'create_prospect_source') {
      setVerticalPosition('top');
    } else {
      setVerticalPosition('bottom');
    }
  }, [currentStep, setVerticalPosition]);

  useEffect(() => {
    if (!currentStep?.targetSelector) {
      setPosition('right');
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        // Si el elemento está en la mitad derecha de la pantalla, mover a la izquierda
        if (rect.right > screenWidth * 0.5) {
          setPosition('left');
        } else {
          setPosition('right');
        }
      } else {
        setPosition('right');
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      observer.disconnect();
    };
  }, [currentStep]);

  // Cuando la posición de anclaje base cambia, reseteamos las coordenadas 
  // de arrastre para evitar que el bot salga despedido fuera de la pantalla.
  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [position, verticalPosition, x, y]);

  return (
    <>
      <BotSpotlight />
      <div className="fixed inset-4 pointer-events-none z-[9998]" ref={constraintsRef} />
      <motion.div 
        drag 
        dragControls={dragControls}
        dragListener={false} 
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x, y, touchAction: "none" }}
        className={`fixed z-[9999] flex gap-4 ${
          verticalPosition === 'top' 
            ? 'top-6 flex-col' 
            : 'bottom-6 flex-col-reverse'
        } ${position === 'left' ? 'left-6 items-start' : 'right-6 items-end'}`}
      >
        <div className="pointer-events-auto cursor-grab active:cursor-grabbing relative z-20">
          <BotAvatar dragControls={dragControls} />
        </div>
        <div className="pointer-events-auto relative z-10">
          <BotPanel position={position} />
        </div>
      </motion.div>
    </>
  );
};

export default MoneycallBot;
