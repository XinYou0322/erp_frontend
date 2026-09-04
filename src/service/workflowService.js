import httpClient from './httpClient'

// 對應後端 WorkflowController 的每支端點
// 專案是 cookie-based 認證（httpClient 已設定 withCredentials），
// 之後後端若能從 session 取得目前登入者，approve/reject 就不用再自己帶 operator
const CURRENT_APPROVER_ID = 3 // TODO: 之後改成從登入狀態取得目前使用者 id

// 後端 WorkflowStatus enum 是大寫（PENDING/APPROVED/REJECTED），
// 畫面元件（WorkflowStatusBadge 等）用小寫字串判斷樣式，這裡統一轉換一次
function normalizeStatus(workflow) {
  return { ...workflow, status: (workflow.status || '').toLowerCase() }
}

// 列表用的欄位命名跟後端 WorkflowResponse 不同，這裡做一次轉換：
// documentTitle/documentDescription/createdAt/id → code/summary/date
function toTableRow(workflow) {
  const normalized = normalizeStatus(workflow)
  return {
    ...normalized,
    code: `WF-${normalized.id}`,
    applicant: normalized.applicantName,   // ← 關鍵：把 applicantName 轉成 applicant
    approver: normalized.approverName,     // ← 關鍵：把 approverName 轉成 approver
    summary: normalized.remark,
    date: formatDate(normalized.createdAt),
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString("zh-TW");
}

export const getPendingWorkflows = (approverId = CURRENT_APPROVER_ID) =>
  httpClient
    .get('/api/workflows/pending', { params: { approverId } })
    .then((res) => res.data.map(toTableRow))

// 明細頁直接用 WorkflowResponse 原本的欄位名稱，只需正規化 status
export const getWorkflowById = (id) =>
  httpClient.get(`/api/workflows/${id}`).then((res) => normalizeStatus(res.data))

export const getWorkflowLogs = (id) =>
  httpClient.get(`/api/workflows/${id}/logs`).then((res) => res.data)

export const approveWorkflow = (id, remark) =>
  httpClient
    .post(`/api/workflows/${id}/approve`, { operator: CURRENT_APPROVER_ID, remark })
    .then((res) => res.data)

export const rejectWorkflow = (id, remark) =>
  httpClient
    .post(`/api/workflows/${id}/reject`, { operator: CURRENT_APPROVER_ID, remark })
    .then((res) => res.data)
