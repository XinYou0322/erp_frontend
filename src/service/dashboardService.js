import httpClient from "./httpClient";

export const getDashboard = () =>
  httpClient.get("/api/dashboard").then(res => res.data);

export function getRevenueDetail(startDate, endDate, groupBy = "DAY") {
  return httpClient
    .get("/api/dashboard/revenue", {
      params: {
        startDate,
        endDate,
        groupBy
      }
    })
    .then((res) => res.data);
}

// 取得客單價詳細分析資料
export function getOrderValueAnalysis(startDate, endDate) {
  return httpClient
    .get("/api/dashboard/order-value-analysis", {
      params: {
        startDate, // 可選：開始日期
        endDate    // 可選：結束日期
      }
    })
    .then((res) => res.data);
}

export function getCostDetail(startDate, endDate, groupBy) {
  return httpClient
  .get("/api/dashboard/cost-detail", {
    params: { startDate, endDate, groupBy },
  })
  .then((res) => res.data);
}