import React from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  Sparkles,
  Clock,
  Edit3,
  AlertTriangle,
  Lock
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Notification, NotificationType } from "@/types";

interface NotificationRowProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onClosePanel?: () => void;
  className?: string;
}

export const NotificationRow: React.FC<NotificationRowProps> = ({
  notification,
  onRead,
  onClosePanel,
  className
}) => {
  const getIconConfig = (type: NotificationType) => {
    switch (type) {
      case "invitation_received":
      case "application_received":
        return {
          icon: <Send className="w-3.5 h-3.5 text-[#4DA2FF]" />,
          border: "border-l-[#4DA2FF]"
        };
      case "invitation_response":
      case "application_response":
        return {
          icon: <Send className="w-3.5 h-3.5 text-[#2DD4BF]" />,
          border: "border-l-[#2DD4BF]"
        };
      case "new_recommendation":
      case "trust_score_updated":
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />,
          border: "border-l-[#8B5CF6]"
        };
      case "milestone_submitted":
        return {
          icon: <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />,
          border: "border-l-[#F59E0B]"
        };
      case "changes_requested":
        return {
          icon: <Edit3 className="w-3.5 h-3.5 text-[#F59E0B]" />,
          border: "border-l-[#F59E0B]"
        };
      case "milestone_released":
      case "escrow_funded":
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />,
          border: "border-l-[#10B981]"
        };
      case "dispute_flagged":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
          border: "border-l-red-400"
        };
      default:
        return {
          icon: <Lock className="w-3.5 h-3.5 text-[#7B61FF]" />,
          border: "border-l-[#7B61FF]"
        };
    }
  };

  const { icon, border } = getIconConfig(notification.type);

  const handleClick = () => {
    if (onRead && !notification.read) {
      onRead(notification.id);
    }
    if (onClosePanel) {
      onClosePanel();
    }
  };

  const formatRelativeTime = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Link
      href={notification.linkTo}
      onClick={handleClick}
      className={twMerge(
        clsx(
          "block p-3.5 rounded-xl border-y border-r border-white/5 border-l-4 transition-all duration-150 hover:bg-white/[0.06] text-xs",
          border,
          notification.read ? "bg-white/[0.01] opacity-70" : "bg-white/[0.04] opacity-100 font-medium",
          className
        )
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-white/5 mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground/90 leading-snug">{notification.text}</p>
          <span className="text-[10px] text-foreground/45 mt-1 block font-mono">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        {!notification.read && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#4DA2FF] shrink-0 mt-1.5" />
        )}
      </div>
    </Link>
  );
};
