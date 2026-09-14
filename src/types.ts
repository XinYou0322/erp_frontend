/**
 * =====================================================================
 * 【核心 TypeScript 型別定義檔 (Core Types)】: src/types.ts
 * =====================================================================
 * 提供 Vue SFC (lang="ts") 靜態型別支援，消除編輯器型別與值混淆之紅字報錯。
 */

export type UserRole = 'admin' | 'manager' | 'employee' | 'guest' | string;

export type PermissionKey = string;

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  module: string;
}

export interface UserProfile {
  id: string | number;
  name: string;
  role: UserRole;
  roleName?: string;
  email: string;
  password?: string;
  avatar?: string;
  department?: string;
  phone?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'locked' | string;
  reason?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string | number;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'danger';
}

export type NavigationTab =
  | 'overview'
  | 'bom'
  | 'suppliers'
  | 'pos'
  | 'workflows'
  | 'analytics'
  | 'settings'
  | 'support';

export interface SKUComponent {
  name: string;
  qty: number;
  unit?: string;
  rawMaterialId?: string;
}

export interface SKUItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  components: SKUComponent[];
  productionCost: number;
  sellingPrice: number;
  stock?: number;
  description?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  stock: number;
  unit: string;
  status: 'sufficient' | 'low' | 'critical';
  icon?: string;
  minStock: number;
  unitCost: number;
}

