export type AdminMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminOption = {
  id: string;
  name: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  isActive: boolean;
  category: AdminOption;
  images: { id: string; url: string }[];
  stores: { inventoryId: string; storeId: string; storeName: string; stock: number }[];
  totalStock: number;
};

export type AdminInventory = {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  imageUrl: string | null;
  storeId: string;
  storeName: string;
  stock: number;
  updatedAt: string;
};

export type StockMutation = {
  id: string;
  type: "IN" | "OUT" | "TRANSFER";
  quantity: number;
  notes: string | null;
  createdAt: string;
};

export type AdminOptions = {
  categories: AdminOption[];
  stores: AdminOption[];
};

export type StockMutationStatus = "REQUESTED" | "REJECTED" | "ACCEPTED" | "SHIPPED" | "RECEIVED";

export type AdminStockMutation = {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  imageUrl: string | null;
  sourceStoreId: string;
  sourceStoreName: string;
  destinationStoreId: string | null;
  destinationStoreName: string | null;
  quantity: number;
  status: StockMutationStatus;
  notes: string | null;
  createdAt: string;
  requestedBy: { id: string; name: string | null; email: string } | null;
  permissions: { canAccept: boolean; canReject: boolean; canShip: boolean; canReceive: boolean };
};

export type AdminCategory = {
  id: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  productCount: number;
};

export type StoreType = "UTAMA" | "CABANG";

export type AdminStore = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: StoreType;
  createdAt: string;
  manager: { id: string; name: string | null; email: string } | null;
};

export type StoreManager = {
  id: string;
  name: string;
  email: string;
};

export type AdminRole = "SUPER_ADMIN" | "STORE_ADMIN" | "CUSTOMER";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: AdminRole;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  profileImageUrl: string | null;
  createdAt: string;
};

export type AdminUserStats = {
  totalUsers: number;
  customers: number;
  staffAccounts: number;
  verifiedUsers: number;
};

export type DashboardMetricData = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeCustomers: number;
};

export type DashboardTrendPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type DashboardTopProduct = {
  name: string;
  imageUrl: string | null;
  quantity: number;
  revenue: number;
};

export type DashboardCategorySale = {
  name: string;
  revenue: number;
  percentage: number;
};

export type AdminDashboardData = {
  metrics: DashboardMetricData;
  revenueTrend: DashboardTrendPoint[];
  topProducts: DashboardTopProduct[];
  salesByCategory: DashboardCategorySale[];
};
