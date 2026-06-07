/**
 * Skeleton Component
 * 
 * Loading placeholder with pulse animation
 */

export const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'h-20 w-20',
    card: 'h-32 w-full',
    tableRow: 'h-12 w-full'
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * Table Skeleton
 */
export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="animate-pulse space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-3 bg-gray-50 rounded">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1" variant="text" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1" variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Card Skeleton
 */
export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg border">
          <Skeleton variant="title" className="mb-2" />
          <Skeleton variant="text" className="mb-1" />
          <Skeleton variant="text" width="w-2/3" />
        </div>
      ))}
    </div>
  );
};

/**
 * Form Skeleton
 */
export const FormSkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton variant="title" width="w-1/4" />
      <Skeleton className="h-10 w-full" />
      
      <Skeleton variant="title" width="w-1/4" />
      <Skeleton className="h-10 w-full" />
      
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
      
      <Skeleton className="h-10 w-32" />
    </div>
  );
};

/**
 * Stats Card Skeleton
 */
export const SkeletonStatsCard = () => {
  return (
    <div className="animate-pulse bg-white p-5 rounded-lg border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-32 bg-gray-200 rounded" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-6 w-20 bg-gray-200 rounded" />
    </div>
  );
};

export default Skeleton;