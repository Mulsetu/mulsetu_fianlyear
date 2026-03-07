// User Types
export type UserRole = 'Farmer' | 'Trader' | 'Logistics' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  userType: UserRole;
  state: string;
  district: string;
  market: string;
  language: string;
  isPremium: boolean;
  walletBalance: number;
  avatar?: string;
  phone?: string;
  location?: string;
  joinDate: string;
  totalReports: number;
  verified: boolean;
  warningCount: number;
  isBlocked: boolean;
}

// Produce Types
export interface Produce {
  id: string;
  name: string;
  category: 'vegetables' | 'fruits' | 'grains' | 'spices' | 'pulses' | 'other';
  subcategory?: string;
  unit: 'kg' | 'quintal' | 'ton' | 'piece' | 'dozen';
  image?: string;
  description?: string;
  seasonality?: string[];
  storageRequirements?: string;
  shelfLife?: number; // in days
  isActive: boolean;
}

export interface ProducePrice {
  id: string;
  produceId: string;
  marketId: string;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  unit: string;
  date: string;
  source: 'user_report' | 'market_data' | 'api' | 'bulk_upload';
  reportedBy?: string;
  verified: boolean;
  quality?: 'A' | 'B' | 'C' | 'D';
  quantity?: number;
}

// Market Types
export interface Market {
  id: string;
  name: string;
  state: string;
  district: string;
  city: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    contactPerson?: string;
  };
  operatingHours?: {
    open: string;
    close: string;
    days: string[];
  };
  facilities?: string[];
  isActive: boolean;
}

// Listing Types
export interface Listing {
  id: string;
  sellerId: string;
  produceId: string;
  marketId: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  quality: 'A' | 'B' | 'C' | 'D';
  grade?: string;
  harvestDate?: string;
  expiryDate?: string;
  images?: string[];
  location: {
    state: string;
    district: string;
    market: string;
  };
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isNegotiable: boolean;
  minimumOrder?: number;
  deliveryAvailable: boolean;
  deliveryRadius?: number; // in km
  sellerType: 'farmer' | 'trader' | 'wholesaler';
}

// Offer Types
export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  conditions?: string[];
  transportCost?: number;
  deliveryAddress?: string;
  paymentTerms?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'refund' | 'withdrawal' | 'deposit' | 'commission';
  amount: number;
  currency: 'INR';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  relatedId?: string; // listingId, offerId, etc.
  paymentMethod: 'wallet' | 'upi' | 'card' | 'netbanking' | 'cash';
  paymentId?: string;
  createdAt: string;
  completedAt?: string;
  fees?: number;
  netAmount: number;
}

// Transport Types
export interface TransportRequest {
  id: string;
  from: string;
  to: string;
  produce: string;
  quantity: number;
  weight: number;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  pickupDate: string;
  deliveryDate: string;
  price: number;
  customer: string;
  customerPhone: string;
  specialInstructions?: string;
  logisticsProviderId?: string;
  vehicleDetails?: {
    type: string;
    number: string;
    capacity: number;
  };
  trackingInfo?: {
    currentLocation?: string;
    lastUpdate?: string;
    estimatedDelivery?: string;
  };
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'price_alert' | 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'listing_sold' | 'transport_update' | 'system' | 'promotion';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  expiresAt?: string;
}

// Analytics Types
export interface PriceTrend {
  produceId: string;
  marketId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  data: {
    date: string;
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    volume?: number;
  }[];
}

export interface MarketComparison {
  produceId: string;
  markets: {
    marketId: string;
    marketName: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    volume: number;
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserRole;
  state: string;
  district: string;
  market: string;
  language: string;
  acceptTerms: boolean;
}

export interface SignInForm {
  email: string;
  password: string;
}

export interface CreateListingForm {
  produceId: string;
  title: string;
  description?: string;
  quantity: number;
  pricePerUnit: number;
  quality: 'A' | 'B' | 'C' | 'D';
  grade?: string;
  harvestDate?: string;
  images?: string[];
  isNegotiable: boolean;
  minimumOrder?: number;
  deliveryAvailable: boolean;
  deliveryRadius?: number;
}

export interface CreateOfferForm {
  listingId: string;
  quantity: number;
  pricePerUnit: number;
  message?: string;
  conditions?: string[];
  transportCost?: number;
  deliveryAddress?: string;
  paymentTerms?: string;
}

// Filter Types
export interface ProduceFilter {
  category?: string;
  subcategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  quality?: string[];
  location?: {
    state?: string;
    district?: string;
    market?: string;
  };
  sellerType?: string[];
  isNegotiable?: boolean;
  deliveryAvailable?: boolean;
}

export interface PriceFilter {
  produceId?: string;
  marketId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  quality?: string[];
  verified?: boolean;
}

// Search Types
export interface SearchQuery {
  query: string;
  filters?: ProduceFilter | PriceFilter;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Settings Types
export interface UserSettings {
  notifications: {
    priceAlerts: boolean;
    offerUpdates: boolean;
    transportUpdates: boolean;
    promotions: boolean;
    system: boolean;
  };
  privacy: {
    showPhone: boolean;
    showEmail: boolean;
    showLocation: boolean;
  };
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  data?: any;
}

// Component Props Types
export interface BaseComponentProps {
  children?: React.ReactNode;
  style?: any;
  testID?: string;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export interface InputProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'phone';
  multiline?: boolean;
  numberOfLines?: number;
}
