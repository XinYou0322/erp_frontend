import httpClient from "@/service/httpClient";

// 拿 session 內的使用者
export const sessionUser = async () => {
  try {
    const response = await httpClient.get("/api/users/now");
    return response.data;
  } catch (error) {
    console.error("取得當前登入者失敗:", error);
    throw error;
  }
};
