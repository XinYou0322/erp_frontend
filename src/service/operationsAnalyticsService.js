import httpClient from "@/service/httpClient";

export const getReplenishmentSuggestions = (params = {}) => {
  return httpClient.get("/api/analytics/replenishment", { params });
};

