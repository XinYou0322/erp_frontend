import httpClient from "@/service/httpClient";

export async function getReceivablePurchaseOrders(date) {
  const response = await httpClient.get("/api/purchaseOrder/receivable", {
    params: date ? { date } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function receivePurchaseOrder(purchaseOrderId, items) {
  const response = await httpClient.post(
    `/api/purchaseOrder/${purchaseOrderId}/receive`,
    { items },
  );
  return response.data;
}
