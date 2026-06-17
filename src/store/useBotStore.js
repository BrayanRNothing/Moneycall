import { create } from 'zustand';

export const useBotStore = create((set, get) => ({
  isOpen: false,
  avatarState: 'resting', // 'resting', 'talking', 'alert', 'thinking'
  currentStep: null, // { id, text, options: [], targetSelector, blockOtherClicks, onTargetClick }
  
  setIsOpen: (isOpen) => set({ isOpen }),
  setAvatarState: (avatarState) => set({ avatarState }),
  setCurrentStep: (step) => set({ currentStep: step, isOpen: true }),
  
  botActions: {},
  setBotActions: (botActions) => set({ botActions }),
  
  verticalPosition: 'bottom',
  setVerticalPosition: (verticalPosition) => set({ verticalPosition }),
  toggleVerticalPosition: () => set((state) => ({ verticalPosition: state.verticalPosition === 'bottom' ? 'top' : 'bottom' })),
  
  // Función para que la UI avise al bot que se cumplió la acción esperada en pantalla
  advanceStep: () => {
    const { currentStep } = get();
    if (currentStep?.onTargetClick) {
      currentStep.onTargetClick();
    }
  },

  toggleBot: () => set((state) => ({ isOpen: !state.isOpen })),
  closeBot: () => set({ isOpen: false, currentStep: null }),
}));
