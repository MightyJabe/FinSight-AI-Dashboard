interface UndoToastProps {
  message: string;
  onUndo: () => void;
}

/**
 *
 */
export function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div className="flex items-center gap-4">
      <span>{message}</span>
      <button
        className="ml-2 px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
        onClick={onUndo}
      >
        Undo
      </button>
    </div>
  );
}
