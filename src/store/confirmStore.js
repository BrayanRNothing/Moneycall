import { create } from 'zustand';

const useConfirmStore = create((set, get) => ({
  isOpen: false,
  title: '¿Estás seguro?',
  message: 'Esta acción no se puede deshacer.',
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  variant: 'danger',
  loading: false,
  onConfirmCallback: null,

  confirmModal: ({
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    variant = 'danger',
    onConfirm,
  }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        loading: false,
        onConfirmCallback: async () => {
          if (onConfirm) {
            set({ loading: true });
            try {
              await onConfirm();
            } catch (err) {
              console.error(err);
            } finally {
              set({ loading: false, isOpen: false });
            }
          } else {
            set({ isOpen: false });
          }
          resolve(true);
        },
      });
    });
  },

  close: () => set({ isOpen: false, loading: false }),
}));

export default useConfirmStore;
