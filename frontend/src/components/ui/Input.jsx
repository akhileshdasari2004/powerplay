import { forwardRef } from 'react';

/**
 * Input component with label, error state, and icons
 * @param {Object} props - Component props
 */
export const Input = forwardRef(function Input(
  {
    label,
    type = 'text',
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    disabled = false,
    readOnly = false,
    required = false,
    error,
    helperText,
    leftIcon,
    rightIcon,
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
    width: '100%',
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: error ? '#f44336' : '#333333',
  };

  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle = {
    width: '100%',
    padding: leftIcon ? '10px 10px 10px 36px' : '10px 12px',
    fontSize: '14px',
    border: `1px solid ${error ? '#f44336' : '#e0e0e0'}`,
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
    color: '#333333',
    ...customStyle,
  };

  const inputWithRightIconStyle = {
    ...inputStyle,
    paddingRight: '36px',
  };

  const iconStyle = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#757575',
    pointerEvents: 'none',
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

      <div style={inputWrapperStyle}>
        {leftIcon && <span style={{ ...iconStyle, left: '10px' }}>{leftIcon}</span>}

        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          style={rightIcon ? inputWithRightIconStyle : inputStyle}
          {...props}
        />

        {rightIcon && (
          <span style={{ ...iconStyle, right: '10px' }}>{rightIcon}</span>
        )}
      </div>

      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
});

/**
 * TextArea component with similar props
 */
export const TextArea = forwardRef(function TextArea(
  {
    label,
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    disabled = false,
    readOnly = false,
    required = false,
    error,
    helperText,
    rows = 4,
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
    width: '100%',
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: error ? '#f44336' : '#333333',
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: `1px solid ${error ? '#f44336' : '#e0e0e0'}`,
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
    minHeight: `${rows * 24}px`,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
    color: '#333333',
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

      <textarea
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        rows={rows}
        style={textareaStyle}
        {...props}
      />

      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
});

export default Input;