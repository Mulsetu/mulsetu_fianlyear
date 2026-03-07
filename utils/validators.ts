// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Password validation
export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Name validation
export const isValidName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return { isValid: false, error: 'Name can only contain letters and spaces' };
  }
  
  return { isValid: true };
};

// Price validation
export const isValidPrice = (price: number): { isValid: boolean; error?: string } => {
  if (price < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }
  
  if (price > 1000000) {
    return { isValid: false, error: 'Price seems too high' };
  }
  
  return { isValid: true };
};

// Quantity validation
export const isValidQuantity = (quantity: number): { isValid: boolean; error?: string } => {
  if (quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than 0' };
  }
  
  if (quantity > 10000) {
    return { isValid: false, error: 'Quantity seems too high' };
  }
  
  return { isValid: true };
};

// Pincode validation
export const isValidPincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Image URL validation
export const isValidImageUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.includes(ext));
};

// Coordinates validation
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
};

// Date validation
export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

// Future date validation
export const isFutureDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

// Past date validation
export const isPastDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

// Age validation
export const isValidAge = (age: number): { isValid: boolean; error?: string } => {
  if (age < 18) {
    return { isValid: false, error: 'Age must be at least 18' };
  }
  
  if (age > 100) {
    return { isValid: false, error: 'Age seems too high' };
  }
  
  return { isValid: true };
};

// File size validation
export const isValidFileSize = (fileSize: number, maxSizeInMB: number = 5): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return fileSize <= maxSizeInBytes;
};

// File type validation
export const isValidFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

// Form validation helpers
export const validateForm = (fields: Record<string, any>, rules: Record<string, any>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const value = fields[field];
    const rule = rules[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.message || `${field} is required`;
      return;
    }
    
    if (value && rule.type === 'email' && !isValidEmail(value)) {
      errors[field] = 'Please enter a valid email address';
      return;
    }
    
    if (value && rule.type === 'phone' && !isValidPhoneNumber(value)) {
      errors[field] = 'Please enter a valid phone number';
      return;
    }
    
    if (value && rule.type === 'password') {
      const passwordValidation = isValidPassword(value);
      if (!passwordValidation.isValid) {
        errors[field] = passwordValidation.errors[0];
        return;
      }
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters long`;
      return;
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field} must be no more than ${rule.maxLength} characters long`;
      return;
    }
    
    if (value && rule.min && Number(value) < rule.min) {
      errors[field] = `${field} must be at least ${rule.min}`;
      return;
    }
    
    if (value && rule.max && Number(value) > rule.max) {
      errors[field] = `${field} must be no more than ${rule.max}`;
      return;
    }
    
    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} format is invalid`;
      return;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Common validation rules
export const validationRules = {
  email: {
    required: true,
    type: 'email',
    message: 'Please enter a valid email address',
  },
  password: {
    required: true,
    type: 'password',
    minLength: 8,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name can only contain letters and spaces',
  },
  phone: {
    required: true,
    type: 'phone',
    message: 'Please enter a valid phone number',
  },
  price: {
    required: true,
    type: 'number',
    min: 0,
    max: 1000000,
  },
  quantity: {
    required: true,
    type: 'number',
    min: 1,
    max: 10000,
  },
};

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const sanitizePrice = (price: string | number): number => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(num * 100) / 100; // Round to 2 decimal places
};
