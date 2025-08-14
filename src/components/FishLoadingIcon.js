import React from 'react';

const FishLoadingIcon = ({ size = 'md', className = '' }) => {
  // Size variants
  const sizeClasses = {
    sm: 'w-6 h-6',    // Small - for bid loading, etc.
    md: 'w-12 h-12',  // Medium - for general loading
    lg: 'w-32 h-32'   // Large - for admin dashboard, etc.
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Fish swimming animation */}
      <div className="animate-pulse">
        <img
          src="https://res.cloudinary.com/ddw4avyim/image/upload/v1752650318/WhatsApp_Image_2025-07-16_at_12.47.22_PM_1_eab8kb.jpg"
          alt="Loading..."
          className={`${sizeClass} object-contain rounded-full shadow-md`}
          style={{
            // Crop to show only fish portion (remove text)
            objectPosition: 'center',
            // Add a subtle swimming effect
            transform: 'scale(0.8)',
            filter: 'brightness(1.1) contrast(1.1)'
          }}
        />
      </div>
      
      {/* Optional: Add swimming text */}
      {size === 'lg' && (
        <p className="mt-4 text-lg text-gray-600 animate-pulse">
          Fishing for data...
        </p>
      )}
    </div>
  );
};

export default FishLoadingIcon;
