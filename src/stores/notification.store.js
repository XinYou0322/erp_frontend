/**
 * =====================================================================
 * 【全域通知中心狀態管理 (Notification Center Store)】: src/stores/notification.store.js
 * =====================================================================
 * 職責說明：
 * 1. 集中管理全系統即時通知、預警通報與待辦提醒（庫存預警、簽核審批、採購物流、資安風險、系統公告）。
 * 2. 串接後端 NotificationController 與 WebSocket 即時推播中樞。
 * 3. 支援未讀計數、分類篩選、單則/批次已讀標記、通知清除與本地快取。
 * 4. 內建 Web Audio API 微音效播送與系統事件自動偵測同步。
 */

import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { StorageService } from "../service/storage.service";
import httpClient from "@/service/httpClient";

/** 預設初始通知資料集 */
const INITIAL_NOTIFICATIONS = [
  {
    id: "ntf-inv-01",
    title: "生豆庫存水位告急",
    message:
      "【衣索比亞 耶加雪菲 生豆】當前庫存僅存 8.0 kg，已低於安全庫存警戒線 (20 kg)，建議立即安排採購。",
    type: "warning",
    category: "inventory",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    isRead: false,
    actionLabel: "前往庫存補充",
    actionRoute: "/bom",
  },
  {
    id: "ntf-wf-01",
    title: "待簽核：採購進貨單審批",
    message:
      "單號 PO-2026-0301（宏達咖啡原物料，$18,400）目前停留在「主管審核」階段，待您簽核放行。",
    type: "info",
    category: "workflow",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
    actionLabel: "進行審批簽核",
    actionRoute: "/workflows",
  },
  {
    id: "ntf-sup-01",
    title: "採購單已確認到貨",
    message:
      "佳賀包裝科技供應之【牛皮紙透氣閥夾鏈袋 250g】1,000 PCS 已全數入庫驗收完畢。",
    type: "success",
    category: "supplier",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isRead: true,
    actionLabel: "查看採購歷程",
    actionRoute: "/suppliers",
  },
];

export const useNotificationStore = defineStore("notification", () => {
  // =====================================================================
  // 1. 狀態定義 (State)
  // =====================================================================
  const notifications = ref(
    StorageService.get("notifications_v1", INITIAL_NOTIFICATIONS),
  );

  /** 當前分類篩選：'all' | 'inventory' | 'workflow' | 'supplier' | 'security' | 'system' */
  const activeCategory = ref("all");

  /** 是否僅顯示未讀通知 */
  const onlyUnread = ref(false);

  /** 是否啟用新通知提示音效 */
  const soundEnabled = ref(StorageService.get("notification_sound", true));

  /** 是否自動接收庫存告急警示 */
  const autoAlertLowStock = ref(
    StorageService.get("notification_auto_low_stock", true),
  );

  /** 後端同步未讀計數 */
  const backendUnreadCount = ref(null);

  let socket = null;

  // 快取持久化
  watch(
    notifications,
    (newList) => {
      StorageService.set("notifications_v1", newList);
    },
    { deep: true },
  );

  watch(soundEnabled, (val) => {
    StorageService.set("notification_sound", val);
  });

  watch(autoAlertLowStock, (val) => {
    StorageService.set("notification_auto_low_stock", val);
  });

  // =====================================================================
  // 2. 計算屬性 (Getters)
  // =====================================================================
  /** 未讀通知總數量 */
  const unreadCount = computed(() => {
    if (backendUnreadCount.value !== null) {
      return backendUnreadCount.value;
    }
    return notifications.value.filter((n) => !n.isRead).length;
  });

  /** 各類別未讀數量統計 */
  const unreadCountsByCategory = computed(() => {
    const counts = {
      all: 0,
      inventory: 0,
      workflow: 0,
      supplier: 0,
      security: 0,
      system: 0,
    };
    notifications.value.forEach((n) => {
      if (!n.isRead) {
        counts.all++;
        if (counts[n.category] !== undefined) {
          counts[n.category]++;
        }
      }
    });
    return counts;
  });

  /** 是否存在危急等級未讀通知 (danger / warning) */
  const hasUrgentNotification = computed(() => {
    return notifications.value.some(
      (n) => !n.isRead && (n.type === "danger" || n.type === "warning"),
    );
  });

  /** 經過分類與未讀篩選後的通知清單 */
  const filteredNotifications = computed(() => {
    return notifications.value
      .filter((n) => {
        if (
          activeCategory.value !== "all" &&
          n.category !== activeCategory.value
        ) {
          return false;
        }
        if (onlyUnread.value && n.isRead) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  });

  // =====================================================================
  // 3. 提示音效 (Audio Notification)
  // =====================================================================
  const playNotificationChime = () => {
    if (!soundEnabled.value) return;
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(830.61, now + 0.12);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(329.63, now);
      osc2.frequency.exponentialRampToValueAtTime(415.3, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      // 忽略部分瀏覽器自動播放策略阻擋
    }
  };

  // =====================================================================
  // 4. WebSocket 即時通訊與後端 API 串接
  // =====================================================================

  /** 連接後端 WebSocket 推播中樞 */
  function connectWebSocket(userId) {
    if (!userId) return;
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    try {
      const baseURL =
        import.meta.env.VITE_AXIOS_HTTP_BASEURL || "http://localhost:8080";
      const wsProto = baseURL.startsWith("https") ? "wss" : "ws";
      const wsHost = baseURL.replace(/^https?:\/\//, "");
      const wsUrl = `${wsProto}://${wsHost}/ws/notifications?userId=${userId}`;

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log(`[WebSocket] 通知中心已連線: userId=${userId}`);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === "NEW_NOTIFICATION" && data.notification) {
            const item = data.notification;
            addNotification(
              {
                id: item.id,
                title: item.title,
                message: item.content,
                type: item.type,
                category: item.category,
                actionRoute: item.actionRoute,
                timestamp: item.createdAt,
                isRead: item.read || false,
              },
              true,
            );
            if (typeof data.unreadCount === "number") {
              backendUnreadCount.value = data.unreadCount;
            }
          }
        } catch (e) {
          console.error("[WebSocket] 解析通知訊息失敗:", e);
        }
      };

      socket.onclose = () => {
        console.log("[WebSocket] 連線關閉");
        socket = null;
      };

      socket.onerror = (err) => {
        console.warn("[WebSocket] 連線異常:", err);
      };
    } catch (err) {
      console.warn("WebSocket 建立失敗:", err);
    }
  }

  /** 從後端取得真實未讀通知數量 */
  async function fetchUnreadCount() {
    try {
      const res = await httpClient.get("/api/notifications/unread-count");
      if (typeof res.data === "number") {
        backendUnreadCount.value = res.data;
      }
    } catch (err) {
      // 靜默降級使用前端計算
    }
  }

  /** 從後端拉取真實歷史通知 */
  async function fetchNotifications() {
    try {
      const res = await httpClient.get("/api/notifications", {
        params: {
          category: activeCategory.value,
          onlyUnread: onlyUnread.value,
          page: 0,
          size: 30,
        },
      });
      if (Array.isArray(res.data)) {
        const serverItems = res.data.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.content,
          type: item.type,
          category: item.category,
          actionRoute: item.actionRoute,
          timestamp: item.createdAt,
          isRead: item.read || false,
        }));
        notifications.value = serverItems;
      }
    } catch (err) {
      console.warn("拉取後端通知失敗，保留本地快取清單:", err);
    }
  }

  // =====================================================================
  // 5. 操作函式 (Actions)
  // =====================================================================
  const addNotification = (item, playSound = true) => {
    const newNotification = {
      id:
        item.id ||
        `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title || "系統新通知",
      message: item.message || "",
      type: item.type || "info",
      category: item.category || "system",
      timestamp: item.timestamp || new Date().toISOString(),
      isRead: item.isRead || false,
      actionLabel: item.actionLabel || "",
      actionRoute: item.actionRoute || "",
    };

    notifications.value.unshift(newNotification);
    if (backendUnreadCount.value !== null) {
      backendUnreadCount.value++;
    }
    if (playSound) {
      playNotificationChime();
    }
  };

  const triggerLowStockAlert = async (materials = []) => {
    const userId = useAuthStore().currentUser?.id;
    if (!Array.isArray(materials) || materials.length === 0 || !userId) {
      return;
    }

    try {
      await httpClient.post("/api/notifications/low-stock", {
        userId,
        materials,
      });

      const topMaterials = materials.slice(0, 3);
      const materialNames = topMaterials
        .map(
          (m) => `${m.name || "原物料"}（${m.stock ?? 0}/${m.minStock ?? 0}）`,
        )
        .join("、");

      addNotification(
        {
          title: `庫存告急：${materials.length} 項原物料低於安全水位`,
          message:
            materialNames.length > 0
              ? `目前低庫存項目：${materialNames}${materials.length > 3 ? "..." : ""}，建議立即補貨。`
              : "目前有原物料低於安全水位，請盡快補貨。",
          type: "warning",
          category: "inventory",
          actionLabel: "前往庫存管理",
          actionRoute: "/material",
        },
        true,
      );
    } catch (err) {
      console.warn("低庫存通知同步失敗:", err);
    }
  };

  /** 單則標記已讀 (同步後端) */
  const markAsRead = async (id) => {
    const target = notifications.value.find((n) => n.id === id);
    if (target && !target.isRead) {
      target.isRead = true;
      if (backendUnreadCount.value !== null && backendUnreadCount.value > 0) {
        backendUnreadCount.value--;
      }
    }
    try {
      await httpClient.patch(`/api/notifications/${id}/read`);
    } catch (e) {
      // 忽略錯誤
    }
  };

  const toggleRead = (id) => {
    const target = notifications.value.find((n) => n.id === id);
    if (target) {
      if (target.isRead) {
        target.isRead = false;
        if (backendUnreadCount.value !== null) backendUnreadCount.value++;
      } else {
        markAsRead(id);
      }
    }
  };

  /** 全部標記為已讀 (同步後端) */
  const markAllAsRead = async () => {
    notifications.value.forEach((n) => {
      n.isRead = true;
    });
    backendUnreadCount.value = 0;
    try {
      await httpClient.post("/api/notifications/mark-all-read", {
        category: activeCategory.value,
      });
    } catch (e) {
      console.warn("標記全部已讀請求失敗:", e);
    }
  };

  const removeNotification = (id) => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  };

  const clearRead = () => {
    notifications.value = notifications.value.filter((n) => !n.isRead);
  };

  /** 清空通知 (同步後端) */
  const clearAll = async () => {
    notifications.value = [];
    backendUnreadCount.value = 0;
    try {
      await httpClient.delete(
        `/api/notifications/clear?category=${activeCategory.value}`,
      );
    } catch (e) {
      console.warn("清空通知失敗:", e);
    }
  };

  /** 觸發後端產生一則測試通知 */
  const triggerSampleAlert = async (userId) => {
    try {
      if (userId) {
        await httpClient.post("/api/notifications/trigger-sample", { userId });
        return;
      }
    } catch (err) {
      console.warn("後端觸發測試通知失敗，降級使用本地模擬:", err);
    }

    // 本地模擬防禦
    const samples = [
      {
        title: "生豆即時降載預警",
        message:
          "【哥倫比亞 薇拉 水洗豆】烘豆車間連續提領 25kg，庫存即將觸及安全下限！",
        type: "warning",
        category: "inventory",
        actionRoute: "/material",
      },
      {
        title: "新請假審批申請",
        message: "員工「Alex Smith」送出特休假單申請 (2天)，待主管核簽。",
        type: "info",
        category: "workflow",
        actionRoute: "/permissions",
      },
      {
        title: "採購訂單到貨通知",
        message: "供應商「大宗生豆進口商」已完成出貨，預計明日抵達總倉。",
        type: "success",
        category: "supplier",
        actionRoute: "/material",
      },
    ];
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    addNotification(randomSample, true);
  };

  const formatTimeAgo = (isoString) => {
    if (!isoString) return "";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "剛剛";
    if (diffMinutes < 60) return `${diffMinutes} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays} 天前`;
    return new Date(isoString).toLocaleDateString("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return {
    notifications,
    activeCategory,
    onlyUnread,
    soundEnabled,
    autoAlertLowStock,
    unreadCount,
    unreadCountsByCategory,
    hasUrgentNotification,
    filteredNotifications,
    addNotification,
    triggerLowStockAlert,
    markAsRead,
    toggleRead,
    markAllAsRead,
    removeNotification,
    clearRead,
    clearAll,
    triggerSampleAlert,
    formatTimeAgo,
    playNotificationChime,
    connectWebSocket,
    fetchUnreadCount,
    fetchNotifications,
  };
});
