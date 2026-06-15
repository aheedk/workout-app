import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn-ghost">
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`btn px-4 py-2.5 text-white ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
