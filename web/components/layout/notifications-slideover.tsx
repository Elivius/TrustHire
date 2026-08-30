"use client";

import React from "react";
import { X, CheckCheck, Bell } from "lucide-react";
import { useApp } from "@/context/app-context";
import { NotificationRow } from "@/components/ui/notification-row";
import { GhostButton } from "@/components/ui/ghost-button";

interface NotificationsSlideOverProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationsSlideOver: React.FC<NotificationsSlideOverProps> = ({
  open,
  onClose
}) => {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  if (!open) return null;

  const userNotifications = notifications.filter((n) => n.userId === currentUser.id);

  // Group notifications into Today and Earlier
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const todayNotifs = userNotifications.filter((n) => new Date(n.createdAt).getTime() >= oneDayAgo);
  const earlierNotifs = userNotifications.filter((n) => new Date(n.createdAt).getTime() < oneDayAgo);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#151622] border-l border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#4DA2FF]" />
              <h2 className="text-base font-semibold text-foreground">Notifications</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-foreground/80">
                {userNotifications.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {userNotifications.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs text-[#2DD4BF] hover:underline inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-foreground/60 hover:text-foreground hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {userNotifications.length === 0 ? (
              <div className="text-center py-12 text-foreground/40 text-xs">
                No notifications right now.
              </div>
            ) : (
              <>
                {todayNotifs.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-foreground/40 font-semibold px-1">
                      Today
                    </div>
                    <div className="space-y-2">
                      {todayNotifs.map((n) => (
                        <NotificationRow
                          key={n.id}
                          notification={n}
                          onRead={markNotificationRead}
                          onClosePanel={onClose}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {earlierNotifs.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-foreground/40 font-semibold px-1">
                      Earlier
                    </div>
                    <div className="space-y-2">
                      {earlierNotifs.map((n) => (
                        <NotificationRow
                          key={n.id}
                          notification={n}
                          onRead={markNotificationRead}
                          onClosePanel={onClose}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
