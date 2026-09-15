import httpClient from "./httpClient";
import { useAuthStore } from "@/stores/auth.store";

function getCurrentUserId() {
  const authStore = useAuthStore();
  return authStore.currentUser?.id;
}

// 建立草稿
export const createLeaveRequest = (payload) =>
  httpClient.post("/api/leave-requests", payload).then((res) => res.data);

// 修改草稿
export const updateLeaveRequest = (id, payload) =>
  httpClient.put(`/api/leave-requests/${id}`, payload).then((res) => res.data);

// 送出簽核
export const submitLeaveRequest = (id, approverId) =>
  httpClient
    .post(`/api/leave-requests/${id}/submit`, { approverId })
    .then((res) => res.data);

// 取消請假單
export const cancelLeaveRequest = (id) =>
  httpClient
    .post(`/api/leave-requests/${id}/cancel`)
    .then((res) => res.data);

// 查單筆
export const getLeaveRequestById = (id) =>
  httpClient.get(`/api/leave-requests/${id}`).then((res) => res.data);

// 查我的請假單
export const getMyLeaveRequests = (applicantId = getCurrentUserId()) =>
  httpClient
    .get(`/api/leave-requests/applicant/${applicantId}`)
    .then((res) => res.data);