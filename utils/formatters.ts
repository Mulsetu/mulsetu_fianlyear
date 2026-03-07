// Currency formatting
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPrice = (price: number, unit: string = 'kg'): string => {
  return `${formatCurrency(price)}/${unit}`;
};

export const formatPriceRange = (minPrice: number, maxPrice: number, unit: string = 'kg'): string => {
  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}/${unit}`;
};

// Date formatting
export const formatDate = (date: string | Date, format: 'short' | 'long' | 'time' | 'relative' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    return formatRelativeTime(dateObj);
  }
  
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
  };
  
  const options = formatOptions[format];
  return new Intl.DateTimeFormat('en-IN', options).format(dateObj);
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

// Number formatting
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatQuantity = (quantity: number, unit: string): string => {
  return `${formatNumber(quantity)} ${unit}`;
};

export const formatWeight = (weight: number): string => {
  if (weight >= 1000) {
    return `${formatNumber(weight / 1000, 1)} ton${weight / 1000 > 1 ? 's' : ''}`;
  }
  return `${formatNumber(weight)} kg`;
};

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value > 0 ? '+' : ''}${formatNumber(value, decimals)}%`;
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

// Text formatting
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Address formatting
export const formatAddress = (address: {
  street?: string;
  city: string;
  district: string;
  state: string;
  pincode?: string;
}): string => {
  const parts = [
    address.street,
    address.city,
    address.district,
    address.state,
    address.pincode,
  ].filter(Boolean);
  
  return parts.join(', ');
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${formatNumber(bytes / Math.pow(k, i), 1)} ${sizes[i]}`;
};

// Time formatting
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

// Distance formatting
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${formatNumber(meters)}m`;
  }
  return `${formatNumber(meters / 1000, 1)}km`;
};

// Temperature formatting
export const formatTemperature = (celsius: number): string => {
  return `${formatNumber(celsius, 1)}°C`;
};

// Status formatting
export const formatStatus = (status: string): string => {
  return status.split('_').map(word => capitalizeFirst(word)).join(' ');
};

// Quality formatting
export const formatQuality = (quality: string): string => {
  const qualityMap: Record<string, string> = {
    'A': 'Premium',
    'B': 'Good',
    'C': 'Average',
    'D': 'Fair',
  };
  
  return qualityMap[quality] || quality;
};

// User type formatting
export const formatUserType = (userType: string): string => {
  const typeMap: Record<string, string> = {
    Farmer: 'Farmer',
    Trader: 'Trader',
    Logistics: 'Logistics Provider',
    Admin: 'Administrator',
  };

  return typeMap[userType] || userType;
};
