import React from 'react';
import useConfirmStore from '../../store/confirmStore';
import ConfirmModal from './ConfirmModal';

const GlobalConfirmModal = () => {
  const { isOpen, title, message, confirmText, cancelText, variant, loading, onConfirmCallback, close } = useConfirmStore();

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={close}
      onConfirm={onConfirmCallback || close}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      loading={loading}
    />
  );
};

export default GlobalConfirmModal;
