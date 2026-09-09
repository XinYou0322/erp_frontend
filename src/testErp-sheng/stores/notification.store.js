/**
 * =====================================================================
 * 【全域通知中心狀態管理 (Notification Center Store)】: src/stores/notification.store.js
 * =====================================================================
 * 職責說明：
 * 1. 集中管理全系統即時通知、預警通報與待辦提醒（庫存預警、簽核審批、採購物流、資安風險、系統公告）。
 * 2. 支援未讀計數、分類篩選、單則/批次已讀標記、通知清除與本地持久化儲存 (localStorage)。
 * 3. 具備深層路由導航跳轉 (Action Route Deep-Link)，點擊通知可直接導向對應業務功能頁面。
 * 4. 內建 Web Audio API 微音效播送與系統事件自動偵測同步 (Auto Sync System Alerts)。
 */

import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { StorageService } from "../services/storage.service";
import httpClient from "/src/service/httpClient.js";

/** 預設初始通知資料集 */
const INITIAL_NOTIFICATIONS = [
  {
    id: "ntf-inv-01",
    title: "生豆庫存水位告急",
    message:
      "【衣索比亞 耶加雪菲 生豆】當前庫存僅存 8.0 kg，已低於安全庫存警戒線 (20 kg)，建議立即安排採購。",
    type: "warning",
    category: "inventory",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 分鐘前
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
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 分鐘前
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
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 小時前
    isRead: true,
    actionLabel: "查看採購歷程",
    actionRoute: "/suppliers",
  },
  {
    id: "ntf-sec-01",
    title: "資安稽核：異地 IP 登入警示",
    message:
      "帳號 linda.wang@humanist.coffee 於 13:42 透過非常用 IP (210.68.12.9) 登入系統後台。",
    type: "danger",
    category: "security",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 小時前
    isRead: false,
    actionLabel: "查看安全日誌",
    actionRoute: "/permissions",
  },
  {
    id: "ntf-sys-01",
    title: "系統資料自動雲端備份完成",
    message:
      "每日例行性 ERP 多階 BOM 結構樹、供應商資產與 POS 銷售單據已成功加密快照備份。",
    type: "info",
    category: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 天前
    isRead: true,
    actionLabel: "查看系統設定",
    actionRoute: "/overview",
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

  // 當通知清單異動時自動快取至 localStorage
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

  let socket = null;
  // 連接後端 WebSocket
  function connectWebSocket(userId) {
    if (socket) socket.close();
    const wsUrl = `ws://localhost:8080/ws/notifications?userId=${userId}`;
    socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "NEW_NOTIFICATION" && data.notification) {
          const item = data.notification;
          // 映射後端欄位到前端
          addNotification(
            {
              id: item.id,
              title: item.title,
              message: item.content, // 後端 content -> 前端 message
              type: item.type,
              category: item.category,
              actionRoute: item.actionRoute,
              timestamp: item.createdAt,
            },
            true,
          );
        }
      } catch (e) {
        console.error("解析通知推播失敗", e);
      }
    };
  }
  // 撈取未讀數量
  async function fetchUnreadCount() {
    try {
      const res = await httpClient.get("/api/notifications/unread-count");
      // 更新狀態...
    } catch (err) {
      console.error(err);
    }
  }

  // =====================================================================
  // 3. 輔助函式 (Audio Notification Sound)
  // =====================================================================
  /** 播放優雅輕快的 Web Audio 微音效 (無需加載外置音頻檔) */
  const playNotificationChime = () => {
    if (!soundEnabled.value) return;
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const now = ctx.currentTime;
      // 雙音和弦 (E5 -> G#5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(830.61, now + 0.12); // G#5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(329.63, now); // E4
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
  // 4. 操作函式 (Actions)
  // =====================================================================
  /**
   * 新增一筆通知
   * @param {Object} item 通知內容
   * @param {boolean} [playSound=true] 是否播放提示音
   */
  const addNotification = (item, playSound = true) => {
    const newNotification = {
      id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title || "系統新通知",
      message: item.message || "",
      type: item.type || "info", // 'warning' | 'danger' | 'info' | 'success'
      category: item.category || "system",
      timestamp: item.timestamp || new Date().toISOString(),
      isRead: false,
      actionLabel: item.actionLabel || "",
      actionRoute: item.actionRoute || "",
    };

    notifications.value.unshift(newNotification);
    if (playSound) {
      playNotificationChime();
    }
  };

  /** 單則標記為已讀 */
  const markAsRead = (id) => {
    const target = notifications.value.find((n) => n.id === id);
    if (target) {
      target.isRead = true;
    }
  };

  /** 切換單則已讀/未讀狀態 */
  const toggleRead = (id) => {
    const target = notifications.value.find((n) => n.id === id);
    if (target) {
      target.isRead = !target.isRead;
    }
  };

  /** 全部標記為已讀 */
  const markAllAsRead = () => {
    notifications.value.forEach((n) => {
      n.isRead = true;
    });
  };

  /** 刪除單則通知 */
  const removeNotification = (id) => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  };

  /** 清空所有已讀通知 */
  const clearRead = () => {
    notifications.value = notifications.value.filter((n) => !n.isRead);
  };

  /** 清空所有通知 */
  const clearAll = () => {
    notifications.value = [];
  };

  /** 產生一則測試通知 (用於 UI 體驗驗證) */
  const triggerSampleAlert = () => {
    const samples = [
      {
        title: "生豆即時降載預警",
        message:
          "【哥倫比亞 薇拉 水洗豆】烘豆車間連續提領 25kg，庫存即將觸及安全下限！",
        type: "warning",
        category: "inventory",
        actionLabel: "檢查庫存明細",
        actionRoute: "/bom",
      },
      {
        title: "新請假審批申請",
        message: "員工「Alex Smith」送出特休假單申請 (2天)，待主管核簽。",
        type: "info",
        category: "workflow",
        actionLabel: "前往假單審批",
        actionRoute: "/workflows",
      },
      {
        title: "POS 收銀日結報表產出",
        message:
          "今日門市營業累計 $32,850 已自動核對完成，營收超越預期目標 115%！",
        type: "success",
        category: "system",
        actionLabel: "查看營運儀表板",
        actionRoute: "/analytics",
      },
      {
        title: "供應商合約到期提醒",
        message:
          "「永勝烘焙包材」年度特約供貨合約將於 14 天後到期，請評估是否續約。",
        type: "info",
        category: "supplier",
        actionLabel: "檢視供應商資料",
        actionRoute: "/suppliers",
      },
    ];

    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    addNotification(randomSample, true);
  };

  /**
   * 格式化相對時間 (如 "3 分鐘前"、"2 小時前")
   * @param {string} isoString
   * @returns {string}
   */
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
    // 狀態
    notifications,
    activeCategory,
    onlyUnread,
    soundEnabled,
    autoAlertLowStock,
    // 計算屬性
    unreadCount,
    unreadCountsByCategory,
    hasUrgentNotification,
    filteredNotifications,
    // 動作
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
  };
});
