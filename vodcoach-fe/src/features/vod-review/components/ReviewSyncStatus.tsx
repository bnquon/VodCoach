"use client";

import { useEffect, useState } from "react";
import { Button, Group, Text } from "@mantine/core";

type ReviewSyncStatusProps = {
  isFetching: boolean;
  lastUpdatedAt: number;
  onUpdateNow: () => void;
};

export function ReviewSyncStatus({
  isFetching,
  lastUpdatedAt,
  onUpdateNow,
}: ReviewSyncStatusProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    function updateNow() {
      setNowMs(Date.now());
    }

    const timeoutID = window.setTimeout(updateNow, 0);
    const intervalID = window.setInterval(updateNow, 5000);

    return () => {
      window.clearTimeout(timeoutID);
      window.clearInterval(intervalID);
    };
  }, []);

  return (
    <Group justify="flex-end" gap="sm">
      <Text c="dimmed" size="xs">
        {getLastUpdatedLabel(lastUpdatedAt, nowMs)}
      </Text>
      <Button
        loading={isFetching}
        size="compact-xs"
        variant="light"
        onClick={onUpdateNow}
      >
        Update now
      </Button>
    </Group>
  );
}

function getLastUpdatedLabel(lastUpdatedAt: number, nowMs: number | null) {
  if (lastUpdatedAt <= 0) {
    return "Not updated yet";
  }
  if (nowMs === null) {
    return "Updated recently";
  }

  const diffSeconds = Math.floor((nowMs - lastUpdatedAt) / 1000);

  if (diffSeconds < 5) {
    return "Updated just now";
  }
  if (diffSeconds < 60) {
    return `Updated ${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes}m ago`;
  }

  return `Updated ${new Date(lastUpdatedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
