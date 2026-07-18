"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Notification } from "@/lib/mock/notifications";
import type { Role } from "@/generated/prisma/enums";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (role !== "CLIENT") return;
    let cancelled = false;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, markAsRead, markAllAsRead }),
    [notifications, unreadCount, markAsRead, markAllAsRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}
