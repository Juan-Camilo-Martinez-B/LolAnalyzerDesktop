export interface SwitchProps {
  checked: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/** Accessible on/off switch used across Settings. */
export function Switch({ checked, label, onClick, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      className="settings-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <i />
    </button>
  );
}
