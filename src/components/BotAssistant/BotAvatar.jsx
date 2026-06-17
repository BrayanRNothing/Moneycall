import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useBotStore } from '../../store/useBotStore';

import imgAsistbot from '../../assets/asistbot.png';

const BotAvatar = ({ dragControls }) => {
  const { avatarState, toggleBot, isOpen } = useBotStore();
  const startPos = useRef({ x: 0, y: 0 });

  const getAvatarImage = () => {
    return imgAsistbot;
  };

  const handlePointerDown = (e) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    dragControls.start(e);
  };

  const handleClick = (e) => {
    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);
    // Si se movió más de 5 píxeles, se considera que fue un arrastre, por ende ignoramos el clic
    if (dx > 5 || dy > 5) return;

    toggleBot();
  };

  const animations = {
    resting: { y: [0, -4, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
    alert: { rotate: [0, -10, 10, -10, 10, 0], transition: { repeat: Infinity, duration: 1 } },
    talking: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } },
    thinking: { y: [0, -8, 0], opacity: [1, 0.8, 1], transition: { repeat: Infinity, duration: 2 } }
  };

  return (
    <motion.div
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className="w-14 h-14 md:w-16 md:h-16 overflow-visible relative z-50 transition-transform flex items-center justify-center cursor-grab active:cursor-grabbing"
      animate={isOpen ? {} : animations[avatarState]}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <img
        src={getAvatarImage()}
        alt={`Bot Avatar - ${avatarState}`}
        className="w-full h-full object-contain drop-shadow-xl select-none pointer-events-none"
        draggable={false}
      />

      {/* Indicador rojo para llamar tu atención si está cerrado */}
      {!isOpen && avatarState === 'talking' && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
      )}
    </motion.div>
  );
};

export default BotAvatar;
