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