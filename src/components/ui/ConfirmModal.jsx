import React from 'react';
import { AlertTriangle, Trash2, UserX, CheckCircle, X } from 'lucide-react';

/**
 * ConfirmModal: Reemplazo moderno y elegante para window.confirm / alert nativos de navegador.
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  loading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700 text-white',
      icon: Trash2,
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: AlertTriangle,
    },
    info: {
      iconBg: 'bg-blue-100 text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: CheckCircle,
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.danger;
  const IconComponent = currentVariant.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full p-6 sm:p-7 relative transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs ${currentVariant.iconBg}`}>
            <IconComponent className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-700 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={async () => {
                await onConfirm();
                onClose();
              }}
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${currentVariant.buttonBg}`}
            >
              {loading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
