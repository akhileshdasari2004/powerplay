import { forwardRef } from 'react';

/**
 * Select component with label, error state, and options
 * @param {Object} props - Component props
 */
const Select = forwardRef(function Select(
  {
    label,
    name,
    value,
    onChange,
    onBlur,
    options = [],
    placeholder = 'Select an option',
    disabled = false,
    required = false,
    error,
    helperText,
    fullWidth = true,
    className = '',
    style: customStyle = {},
    ...props
  },
  ref
) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: fullWidth ? '100%' : 'auto',
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: error ? '#f44336' : '#333333',
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 36px 10px 12px',
    fontSize: '14px',
    border: `1px solid ${error ? '#f44336' : '#e0e0e0'}`,
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
    color: value ? '#333333' : '#757575',
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23757575' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    transition: 'border-color 0.2s ease',
    ...customStyle,
  };

  const helperStyle = {
    fontSize: '12px',
    color: error ? '#f44336' : '#757575',
  };

  return (
    <div style={containerStyle} className={className}>
      {label && (
        <label htmlFor={name} style={labelStyle}>
          {label}
          {required && <span style={{ color: '#f44336', marginLeft: '2px' }}>*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        style={selectStyle}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
});

export default Select;