import httpClient from "./httpClient";

export const getDashboard = () =>
  httpClient.get("/api/dashboard").then(res => res.data);