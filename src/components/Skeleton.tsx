import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseStyles = "bg-gray-200 dark:bg-gray-800 animate-skeleton";
  
  const variantStyles = {
    text: "h-4 w-full rounded",
    rect: "rounded-xl",
    circle: "rounded-full"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
  );
};

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-black rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton variant="text" className="h-6 w-2/3" />
      <Skeleton variant="rect" className="h-6 w-16" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton variant="circle" className="h-4 w-4" />
      <Skeleton variant="text" className="h-4 w-1/2" />
    </div>
    <div className="flex gap-2">
      <Skeleton variant="rect" className="h-6 w-20" />
      <Skeleton variant="rect" className="h-6 w-24" />
    </div>
    <Skeleton variant="rect" className="h-10 w-full rounded-xl" />
  </div>
);
