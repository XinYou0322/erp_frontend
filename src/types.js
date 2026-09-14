/**
 * =====================================================================
 * 【核心資料結構與型別規格說明 (Core Types & JSDoc Schemas)】: src/types.js
 * =====================================================================
 * 職責說明：
 * 本檔案以標準 JavaScript (JSDoc) 形式記錄系統中所有業務資料模型，
 * 提供開發者清晰的欄位定義與代碼提示，並在 JavaScript 模組化環境中導出
 * 對應的型別常數占位符以確保向下相容與全域參照。
 *
 * 涵蓋領域：
 * 1. 使用者角色等級與權限識別碼 (UserRole & PermissionKey)
 * 2. 多階 BOM 物料樹節點 (BOMTreeNode, BOMNodeType, BOMAssemblyPreset)
 * 3. 庫存原料與商品配方 (RawMaterial, SKUItem, SKUComponent)
 * 4. 供應鏈廠商與採購單據 (Supplier, PurchaseOrder)
 * 5. POS 收銀銷售單與購物車 (POSProduct, CartItem, SalesOrder)
 * 6. 電子簽核流程與假單管理 (ActiveWorkflow, WorkflowStep, LeaveRequest)
 * 7. 系統資安稽核軌跡與歷程 (SecurityAuditLog, HistoryEvent)
 */

// =====================================================================
// 1. 使用者角色與 RBAC 權限管控
// =====================================================================

/**
 * @typedef {'admin' | 'manager' | 'employee' | 'guest'} UserRole
 * 系統支援的使用者角色等級：
 * - admin: 系統管理員 (全權限)
 * - manager: 部門主管 (審批、修改、匯出)
 * - employee: 一般員工 (瀏覽、POS收銀、送出假單)
 * - guest: 訪客/查核人員 (唯讀)
 */

/**
 * @typedef {string} PermissionKey
 * 細粒度權限識別碼 (Permission Key) - 格式為「模組.動作」
 * 例如: 'overview.view', 'bom.export', 'suppliers.manage'
 */

/**
 * @typedef {Object} PermissionDefinition
 * @property {PermissionKey} key - 權限識別碼
 * @property {string} label - 權限名稱
 * @property {string} description - 權限說明
 * @property {string} module - 所屬功能模組
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - 使用者識別碼
 * @property {string} name - 姓名
 * @property {UserRole} role - 角色等級
 * @property {string} roleName - 角色中文抬頭
 * @property {string} email - 電子郵件
 * @property {string} [password] - 密碼
 * @property {string} avatar - 頭像圖標或網址
 * @property {string} department - 部門
 * @property {string} [phone] - 聯絡電話
 * @property {'active' | 'inactive' | 'locked'} [status] - 帳號狀態
 * @property {string} [lastLogin] - 最後登入時間
 * @property {string} [createdAt] - 建立日期
 */

/**
 * @typedef {Object} SecurityAuditLog
 * @property {string} id - 紀錄識別碼
 * @property {string} timestamp - 時間戳記
 * @property {string} userId - 操作者 ID
 * @property {string} userName - 操作者姓名
 * @property {string} action - 操作動作
 * @property {string} module - 影響模組
 * @property {string} details - 詳細內容
 * @property {string} ipAddress - 來源 IP
 * @property {'success' | 'warning' | 'danger'} status - 狀態等級
 */

/**
 * @typedef {'overview' | 'bom' | 'suppliers' | 'pos' | 'workflows' | 'analytics' | 'settings' | 'support'} NavigationTab
 */

// =====================================================================
// 2. 庫存、物料與產品配方 (Inventory & SKU)
// =====================================================================

/**
 * @typedef {Object} SKUComponent
 * @property {string} name - 原料名稱
 * @property {number} qty - 耗用數量
 * @property {string} [unit] - 計量單位
 * @property {string} [rawMaterialId] - 關聯原料 ID
 */

/**
 * @typedef {Object} SKUItem
 * @property {string} id - 唯一識別碼
 * @property {string} sku - 商品料號
 * @property {string} name - 品名
 * @property {string} category - 分類
 * @property {SKUComponent[]} components - 配方成分清單
 * @property {number} productionCost - 生產物料成本
 * @property {number} sellingPrice - 終端定價
 * @property {number} stock - 當前庫存數量
 * @property {string} [description] - 規格描述
 */

/**
 * @typedef {Object} RawMaterial
 * @property {string} id - 原料識別碼
 * @property {string} name - 原料品名
 * @property {string} sku - 原料編號
 * @property {number} stock - 當前在庫量
 * @property {string} unit - 單位
 * @property {'sufficient' | 'low' | 'critical'} status - 庫存狀態
 * @property {string} icon - Material 圖示
 * @property {number} minStock - 安全庫存警戒值
 * @property {number} unitCost - 進貨採購單價
 */

// =====================================================================
// 3. 供應鏈與採購單 (Suppliers & Purchase Orders)
// =====================================================================

/**
 * @typedef {Object} Supplier
 * @property {string} id - 供應商識別碼
 * @property {string} name - 廠商全名
 * @property {string} code - 廠商代碼
 * @property {'原物料' | '包裝' | '零組件' | '設備'} category - 供貨類別
 * @property {'活躍' | '審核中' | '暫停'} status - 合作狀態
 * @property {string} lastOrderDate - 上次訂貨日
 * @property {string} contactPerson - 窗口業務
 * @property {string} email - 聯絡信箱
 * @property {string} phone - 聯絡電話
 * @property {string} address - 通訊地址
 * @property {string} description - 備註說明
 * @property {string} icon - 代表圖示
 */

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id - 採購單 ID
 * @property {string} poNumber - 採購單號 (如 PO-2026-0301)
 * @property {string} supplierId - 供應商 ID
 * @property {string} supplierName - 供應商名稱
 * @property {Array<{ name: string, qty: number, unitPrice: number }>} items - 採購明細項目
 * @property {number} totalAmount - 採購總金額
 * @property {string} orderDate - 下單日期
 * @property {'已履行' | '處理中' | '待審核' | '已取消'} status - 單據狀態
 */

// =====================================================================
// 4. POS 現場收銀 (Point of Sale)
// =====================================================================

/**
 * @typedef {Object} POSProduct
 * @property {string} id - 商品代碼
 * @property {string} name - 商品名稱
 * @property {'咖啡' | '糕點' | '周邊商品' | '全部'} category - 分類
 * @property {number} price - 銷售金額
 * @property {string} specification - 規格說明
 * @property {string} [image] - 圖片網址
 * @property {string} [icon] - 圖標
 * @property {boolean} [isOutOfStock] - 是否售罄
 * @property {Array<{ rawMaterialId: string, name: string, qty: number }>} [bomComponents] - 扣庫配方
 */

/**
 * @typedef {Object} CartItem
 * @property {POSProduct} product - 購物車品項
 * @property {number} quantity - 訂購數量
 */

/**
 * @typedef {Object} SalesOrder
 * @property {string} id - 銷售單代號
 * @property {string} orderNumber - 訂單號碼
 * @property {Array<{ product: POSProduct, quantity: number }>} items - 銷售明細
 * @property {number} subtotal - 小計
 * @property {number} tax - 稅金
 * @property {number} total - 實收總計
 * @property {'信用卡' | '現金' | 'LINE Pay'} paymentMethod - 支付方式
 * @property {string} timestamp - 交易時間
 * @property {'已完成' | '已退款'} status - 交易狀態
 */

// =====================================================================
// 5. 簽核工作流與員工差假 (Workflows & HR)
// =====================================================================

/**
 * @typedef {Object} WorkflowStep
 * @property {string} id - 關卡編號
 * @property {string} title - 關卡名稱
 * @property {string} [date] - 簽核日期時間
 * @property {'completed' | 'in_progress' | 'upcoming'} status - 審批進度
 * @property {string} icon - 關卡圖示
 */

/**
 * @typedef {Object} ActiveWorkflow
 * @property {string} id - 流程編號
 * @property {string} poNumber - 關聯單據編號
 * @property {string} creator - 申請人
 * @property {string} createdAt - 送審時間
 * @property {number} currentStepIndex - 目前關卡索引
 * @property {string} currentNode - 目前關卡名稱
 * @property {string} assignee - 目前簽核指派人
 * @property {string} department - 申請部門
 * @property {string} estimatedTime - 預估完成時間
 * @property {WorkflowStep[]} steps - 各關卡歷程
 */

/**
 * @typedef {Object} LeaveRequest
 * @property {string} id - 假單序號
 * @property {string} employeeName - 請假同仁
 * @property {string} avatar - 頭像
 * @property {'病假' | '特休' | '事假' | '訓練'} type - 假別
 * @property {number} days - 請假天數
 * @property {string} dateRange - 區間
 * @property {'pending' | 'approved' | 'rejected'} status - 假單狀態
 */

// =====================================================================
// 6. 營運指標、耗損分析與操作歷程
// =====================================================================

/**
 * @typedef {Object} StoreRanking
 * @property {string} rank - 名次
 * @property {string} name - 分店名稱
 * @property {number} revenue - 當期營收
 * @property {number} targetRate - 目標達成率
 * @property {'超標' | '符合預期' | '落後'} status - 績效狀態
 */

/**
 * @typedef {Object} InventoryWastage
 * @property {string} category - 原料種類
 * @property {number} rate - 耗損率 (%)
 * @property {number} percentFill - 圖表填滿比例
 * @property {'error' | 'warning' | 'normal'} status - 警示等級
 */

/**
 * @typedef {Object} HistoryEvent
 * @property {string} id - 歷史事件序號
 * @property {string} title - 事件標題
 * @property {string} description - 詳細描述
 * @property {string} timestamp - 發生時間
 * @property {'bom' | 'pos' | 'workflow' | 'supplier'} type - 業務模組種類
 */

// =====================================================================
// 7. 多階物料清單樹 (Multilevel BOM Tree & Engineering)
// =====================================================================

/**
 * @typedef {'assembly' | 'subassembly' | 'component' | 'material'} BOMNodeType
 */

/**
 * @typedef {Object} BOMTreeNode
 * @property {string} id - 節點唯一識別碼
 * @property {string} name - 零件或總成名稱
 * @property {string} partNumber - 工程料號 (如 ASM-ROBOT-001)
 * @property {BOMNodeType} type - 節點種類
 * @property {number} quantity - 單次組裝所需用量
 * @property {string} unit - 計量單位 (PCS, KG, M 等)
 * @property {number} unitCost - 單項物料成本
 * @property {number} [scrapRate] - 預期損耗率 (%)
 * @property {number} [leadTimeDays] - 採購備料天數
 * @property {'in-house' | 'purchased' | 'outsourced'} [source] - 物料來源
 * @property {string} [supplier] - 指定供應廠商
 * @property {string} [rawMaterialId] - 關聯實體庫存 ID
 * @property {string} [description] - 工程描述
 * @property {boolean} [expanded] - 樹狀 UI 展開狀態
 * @property {BOMTreeNode[]} [children] - 下階子節點清單
 */

/**
 * @typedef {Object} BOMAssemblyPreset
 * @property {string} id - 範本識別碼
 * @property {string} name - 產品名稱
 * @property {string} partNumber - 主料號
 * @property {string} category - 產品類別
 * @property {string} version - 工程版號
 * @property {BOMTreeNode} rootNode - 根總成節點
 */

// =====================================================================
// 導出型別常數占位符以滿足 ESM 模組引入規格
// =====================================================================
export const UserRole = {};
export const PermissionKey = {};
export const PermissionDefinition = {};
export const UserProfile = {};
export const SecurityAuditLog = {};
export const NavigationTab = {};
export const SKUComponent = {};
export const SKUItem = {};
export const RawMaterial = {};
export const Supplier = {};
export const PurchaseOrder = {};
export const POSProduct = {};
export const CartItem = {};
export const SalesOrder = {};
export const WorkflowStep = {};
export const ActiveWorkflow = {};
export const LeaveRequest = {};
export const StoreRanking = {};
export const InventoryWastage = {};
export const HistoryEvent = {};
export const BOMNodeType = {};
export const BOMTreeNode = {};
export const BOMAssemblyPreset = {};
