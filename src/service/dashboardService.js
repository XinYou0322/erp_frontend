import httpClient from "./httpClient";

export const getDashboard = () =>
  httpClient.get("/api/dashboard").then(res => res.data);

// 營收詳情（range: 'week' | 'month'）
export const getRevenueDetail = (range = "week") =>
  httpClient
    .get("/api/dashboard/revenue", { params: { range } })
    .then((res) => res.data)