// components/ui/ToggleSwitch.tsx
import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  leftIcon?: string;
  rightIcon?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  leftLabel,
  rightLabel,
  leftIcon,
  rightIcon,
  disabled = false
}) => {
  return (
    <div className="toggle-switch-container">
      <div className="toggle-switch-wrapper">
        <label 
          className={`toggle-switch-label ${!checked ? 'active' : ''}`}
          onClick={() => !disabled && onChange(false)}
        >
          {leftIcon && <span className="toggle-icon">{leftIcon}</span>}
          {leftLabel}
        </label>
        
        <div 
          className={`toggle-switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && onChange(!checked)}
        >
          <div className="toggle-switch-slider">
            <div className="toggle-switch-thumb" />
          </div>
        </div>
        
        <label 
          className={`toggle-switch-label ${checked ? 'active' : ''}`}
          onClick={() => !disabled && onChange(true)}
        >
          {rightIcon && <span className="toggle-icon">{rightIcon}</span>}
          {rightLabel}
        </label>
      </div>
    </div>
  );
};

export default ToggleSwitch;
