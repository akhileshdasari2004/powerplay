import { memo } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { SkeletonStatsCard } from './ui/Skeleton';

/**
 * StatsCard - Card component for displaying statistics
 * @param {Object} props - Component props
 */
export const StatsCard = memo(function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  isLoading = false,
  variant = 'default',
  onClick,
}) {
  if (isLoading) {
    return <SkeletonStatsCard />;
  }

  const variantStyles = {
    default: {
      backgroundColor: '#ffffff',
      borderColor: '#e0e0e0',
      iconBg: '#f5f5f5',
      iconColor: '#757575',
    },
    primary: {
      backgroundColor: '#ffffff',
      borderColor: '#1976d2',
      iconBg: '#e3f2fd',
      iconColor: '#1976d2',
    },
    success: {
      backgroundColor: '#ffffff',
      borderColor: '#4caf50',
      iconBg: '#e8f5e9',
      iconColor: '#4caf50',
    },
    warning: {
      backgroundColor: '#ffffff',
      borderColor: '#ff9800',
      iconBg: '#fff3e0',
      iconColor: '#ff9800',
    },
    danger: {
      backgroundColor: '#ffffff',
      borderColor: '#f44336',
      iconBg: '#ffebee',
      iconColor: '#f44336',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  const containerStyle = {
    padding: '20px',
    backgroundColor: style.backgroundColor,
    border: `1px solid ${style.borderColor}`,
    borderRadius: '8px',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
  };

  const iconContainerStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    backgroundColor: style.iconBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: style.iconColor,
  };

  const titleStyle = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#757575',
    marginBottom: '4px',
  };

  const valueStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#333333',
    lineHeight: 1.2,
  };

  const trendStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    marginTop: '8px',
  };

  const getTrendStyle = () => {
    if (!trend) return {};

    const isPositive = trend > 0;
    const isNegative = trend < 0;

    if (isPositive) {
      return {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
      };
    }
    if (isNegative) {
      return {
        backgroundColor: '#ffebee',
        color: '#c62828',
      };
    }
    return {
      backgroundColor: '#f5f5f5',
      color: '#757575',
    };
  };

  const subtitleStyle = {
    fontSize: '13px',
    color: '#757575',
    marginTop: '8px',
  };

  return (
    <div
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>{title}</div>
          <div style={valueStyle}>{value}</div>
        </div>
        {icon && <div style={iconContainerStyle}>{icon}</div>}
      </div>

      {trend !== undefined && (
        <div style={{ ...trendStyle, ...getTrendStyle() }}>
          {trend > 0 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5z" />
            </svg>
          )}
          {trend < 0 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          )}
          {Math.abs(trend)}%{trendLabel && ` ${trendLabel}`}
        </div>
      )}

      {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
    </div>
  );
});

/**
 * StatsGrid - Grid layout for multiple StatsCards
 */
export function StatsGrid({ children, columns = 4 }) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '16px',
  };

  // Responsive grid
  const responsiveStyle = {
    '@media (maxWidth: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (maxWidth: 600px)': {
      gridTemplateColumns: '1fr',
    },
  };

  return <div style={{ ...gridStyle, ...responsiveStyle }}>{children}</div>;
}

export default StatsCard;