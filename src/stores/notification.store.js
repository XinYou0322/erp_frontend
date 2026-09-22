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
import { useAuthStore } from "./auth.store";

/** 預設初始通知資料集 */
const INITIAL_NOTIFICATIONS = [];

export const useNotificationStore = defineStore("notification", () => {
  // =====================================================================
  // 1. 狀態定義 (State)
  // =====================================================================
  const notifications = ref(
    StorageService.get("notifications_v1", INITIAL_NOTIFICATIONS),
  );

  // 📢 新增：用來暫存被使用者手動「清除已讀」或「點擊垃圾桶」的通知 ID 陣列
  const clearedNotificationIds = ref(
    StorageService.get("cleared_notification_ids_v1", []),
  );

  // 📢 新增：監聽並保存已清除的 ID 到本地快取
  watch(
    clearedNotificationIds,
    (newList) => {
      StorageService.set("cleared_notification_ids_v1", newList);
    },
    { deep: true },
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

  /** =====================================================================
   * 新增：考勤與原物料相關通知 Action
   * ===================================================================== */

  // 1. 打卡簽到通知
  const triggerCheckInAlert = (userName, time) => {
    addNotification(
      {
        title: "員工簽到成功",
        message: `同仁【${userName}】已於 ${time} 完成今日上班打卡簽到。`,
        type: "success",
        category: "security", // 歸類在資安考勤
        actionLabel: "檢視考勤報表",
        actionRoute: "/attendance", // 你的考勤路由
      },
      true,
    );
  };

  // 2. 打卡簽退通知
  const triggerCheckOutAlert = (userName, time) => {
    addNotification(
      {
        title: "員工簽退成功",
        message: `同仁【${userName}】已於 ${time} 完成今日下班打卡簽退。`,
        type: "info",
        category: "security",
        actionLabel: "檢視考勤報表",
        actionRoute: "/attendance",
      },
      true,
    );
  };

  // 3. 新增原物料通知
  const triggerMaterialCreatedAlert = (materialName, creator) => {
    addNotification(
      {
        title: "成功建立新原物料項目",
        message: `由【${creator}】新增了原物料：${materialName}，已建檔至物料清單。`,
        type: "success",
        category: "inventory", // 歸類在庫存物料
        actionLabel: "前往物料清單",
        actionRoute: "/material",
      },
      true,
    );
  };

  // 4. 進貨原物料通知
  const triggerMaterialImportedAlert = (materialName, quantity, batchNo) => {
    addNotification(
      {
        title: "原物料進貨入庫通知",
        message: `原物料【${materialName}】已成功進貨入庫 ${quantity} kg！批號：${batchNo}。`,
        type: "success",
        category: "supplier", // 歸類在採購供鏈
        actionLabel: "查看庫存流水帳",
        actionRoute: "/bom",
      },
      true,
    );
  };

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

  const isValidUserId = (userId) => {
    if (userId === null || userId === undefined) return false;
    if (Number.isInteger(userId)) return userId >= 0;
    if (typeof userId === "string") {
      const trimmed = userId.trim();
      if (!trimmed) return false;
      const parsed = Number(trimmed);
      return Number.isInteger(parsed) && parsed >= 0;
    }
    return false;
  };

  /** 連接後端 WebSocket 推播中樞 */
  function connectWebSocket(userId) {
    const normalizedUserId = Number.isInteger(userId)
      ? userId
      : typeof userId === "string" && /^\d+$/.test(userId.trim())
        ? Number(userId)
        : null;

    if (!isValidUserId(normalizedUserId)) return;
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
      const wsUrl = `${wsProto}://${wsHost}/ws/notifications?userId=${normalizedUserId}`;

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
    const currentUserId = useAuthStore().currentUser?.id;
    if (!isValidUserId(currentUserId)) return;
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
    const currentUserId = useAuthStore().currentUser?.id;
    if (!isValidUserId(currentUserId)) return;
    try {
      const res = await httpClient.get("/api/notifications", {
        params: {
          category: activeCategory.value,
          onlyUnread: onlyUnread.value,
          page: 0,
          size: 30,
        },
      });

      // 🌟 1. 先把「目前畫面上由前端自己偵測生成」的庫存通知（ID 帶有 ntf- 的卡片）過濾保留下來
      // 同時排除掉已經被使用者點過「清除已讀」或「垃圾桶」的臨時通知
      const localStockAlerts = notifications.value.filter(
        (item) =>
          typeof item.id === "string" &&
          item.id.startsWith("ntf-") &&
          !clearedNotificationIds.value.includes(item.id),
      );

      if (Array.isArray(res.data)) {
        const serverItems = res.data.map((item) => ({
          id: item.id, // 後端 Long 型態的數字 ID
          title: item.title,
          message: item.content || item.message || "",
          type: item.type,
          category: item.category,
          actionRoute: item.actionRoute,
          timestamp: item.createdAt,
          isRead: item.read || false,
        }));

        // 🌟 2. 過濾後端撈回來的歷史舊通知，踢掉被清除黑名單紀錄的項目
        const filteredServerItems = serverItems.filter(
          (item) => !clearedNotificationIds.value.includes(item.id),
        );

        // 🌟 3.【核心修復關鍵】：將後端的通知與前端本地的低庫存通知「合併」起來！
        // 這樣重新整理網頁時，黑糖珍珠、仙草凍等手動生成的項目才不會被後端的空資料直接沖掉、洗掉！
        notifications.value = [...localStockAlerts, ...filteredServerItems];

        // 🌟 4. 去除因 WebSocket 重複推送或併發可能導致的極少數 ID 重複卡片
        const seenIds = new Set();
        notifications.value = notifications.value.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
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
    const rawUserId = useAuthStore().currentUser?.id;
    const userId = Number.isInteger(rawUserId)
      ? rawUserId
      : typeof rawUserId === "string" && /^\d+\$/.test(rawUserId.trim())
        ? Number(rawUserId)
        : null;

    if (
      !Array.isArray(materials) ||
      materials.length === 0 ||
      !isValidUserId(userId)
    ) {
      return;
    }

    try {
      // 1. 同步將低庫存陣列發送給後端（讓後端記錄與推播）
      await httpClient.post("/api/notifications/low-stock", {
        userId,
        materials,
      });

      let hasNewAlert = false;

      // 2. 巡迴檢查每一項低庫存物料
      materials.forEach((m) => {
        const isCritical = (m.stock ?? 0) === 0;

        // 🌟 核心關鍵：動態生成這項物料的唯一識別 ID
        const targetId = `ntf-inv-low-${m.code || "unknown"}`;

        // 🔍 【防重複檢查一】：檢查當前的通知清單中，是否已經存在這筆 ID？
        const exists = notifications.value.find((n) => n.id === targetId);

        if (exists) {
          // 如果這則通知已經存在，且使用者已經讀過了，或者內容沒變，我們就直接跳過它，不再重複塞入
          return;
        }

        // 🔍 【防重複檢查二】：如果是後端 API/WebSocket 已經撈過回來的舊歷史通知，也阻擋
        const isDuplicateInMessage = notifications.value.some(
          (n) =>
            n.category === "inventory" && n.message.includes(`【${m.name}】`),
        );
        if (isDuplicateInMessage) {
          return;
        }

        // 🚀 通過檢查，代表這是真正需要提醒的全新告警
        addNotification(
          {
            id: targetId,
            title: isCritical
              ? `${m.name} 庫存緊急缺料`
              : `${m.name} 庫存水位告急`,
            message: `【${m.name}】當前可用庫存僅存 ${m.stock} ${m.unit}，已低於安全庫存警戒線 (${m.minStock} ${m.unit})，建議立即安排採購。`,
            type: isCritical ? "danger" : "warning",
            category: "inventory",
            actionLabel: "前往庫存補充",
            actionRoute: `/material`,
          },
          false, // 先傳入 false，避免迴圈連續跳出時提示音爆音
        );

        hasNewAlert = true;
      });

      // 📢 如果這次重新整理，真的有發現「之前沒看過的全新低庫存品項」，才播放提示音
      if (hasNewAlert) {
        playNotificationChime();
      }
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
    // 🌟 1. 檢查 ID 是否為前端自訂生成的字串 (例如帶有 'ntf-')
    if (typeof id === "string" && id.startsWith("ntf-")) {
      console.log(
        `[通知中心] 前端臨時通知 ${id} 已在本地標記已讀，跳過發送 API，成功防禦 400 錯誤。`,
      );
      return;
    }

    // 🌟 2. 只有當 ID 是純數字時 (符合後端 Long 型態)，才正常發送請求給後端
    try {
      await httpClient.patch(`/api/notifications/${id}/read`);
    } catch (e) {
      console.warn("後端標記已讀失敗:", e);
    }
  };

  const toggleRead = (id) => {
    const target = notifications.value.find((n) => n.id === id);
    if (target) {
      if (target.isRead) {
        target.isRead = false;
        if (backendUnreadCount.value !== null) backendUnreadCount.value++;

        // 只有非臨時自訂 ID 才需同步後端
        if (!(typeof id === "string" && id.startsWith("ntf-"))) {
          httpClient.patch(`/api/notifications/${id}/unread`).catch(() => {});
        }
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

  /** 單則刪除通知 (👉 修正：點擊垃圾桶時同步通知後端) */
  const removeNotification = async (id) => {
    // 1. 將該 ID 紀錄到已清除名單中，保證按 F5 從後端撈回時絕對不會復活
    if (!clearedNotificationIds.value.includes(id)) {
      clearedNotificationIds.value.push(id);
    }

    // 2. 前端畫面直接過濾移除，讓使用者立刻感覺被刪除了
    notifications.value = notifications.value.filter((n) => n.id !== id);

    // 3. 降級防禦：將此卡片同步為已讀狀態
    await markAsRead(id);
  };

  /** 清除已讀通知 (👉 修正：同步清理後端或本地快取) */
  const clearRead = async () => {
    // 1. 找出當前畫面所有已經讀取的通知 ID
    const readIds = notifications.value
      .filter((n) => n.isRead)
      .map((n) => n.id);

    if (readIds.length === 0) return;

    // 2. 核心改動：把這些被清除的已讀 ID 通通記錄到快取黑名單，防止 F5 重整時復活
    readIds.forEach((id) => {
      if (!clearedNotificationIds.value.includes(id)) {
        clearedNotificationIds.value.push(id);
      }
    });

    // 3. 前端畫面正式移除這些已讀項目
    notifications.value = notifications.value.filter((n) => !n.isRead);
  };

  /** 清空通知 (同步後端) */
  const clearAll = async () => {
    // 1. 找出當前畫面所有已經讀取的通知 ID
    const readIds = notifications.value
      .filter((n) => n.isRead)
      .map((n) => n.id);

    if (readIds.length === 0) return;

    // 2. 核心改動：把這些被清除的已讀 ID 通通記錄到快取黑名單，防止 F5 重整時復活
    readIds.forEach((id) => {
      if (!clearedNotificationIds.value.includes(id)) {
        clearedNotificationIds.value.push(id);
      }
    });

    // 3. 前端畫面正式移除這些已讀項目
    notifications.value = notifications.value.filter((n) => !n.isRead);
  };

  /** 觸發後端產生一則測試通知 */
  const triggerSampleAlert = async (userId) => {
    const normalizedUserId = Number.isInteger(userId)
      ? userId
      : typeof userId === "string" && /^\d+$/.test(userId.trim())
        ? Number(userId)
        : null;

    try {
      if (isValidUserId(normalizedUserId)) {
        await httpClient.post("/api/notifications/trigger-sample", {
          userId: normalizedUserId,
        });
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
    triggerCheckInAlert,
    triggerCheckOutAlert,
    triggerMaterialCreatedAlert,
    triggerMaterialImportedAlert,
    triggerLowStockAlert,
    addNotification,
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
