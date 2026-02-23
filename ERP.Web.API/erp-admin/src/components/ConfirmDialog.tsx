import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface Props {
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ message, onConfirm, onClose, loading }: Props) {
  return (
    <Modal title="Confirm Delete" onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-4 bg-red-500/10 rounded-2xl ring-1 ring-red-500/20">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700/60 text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
