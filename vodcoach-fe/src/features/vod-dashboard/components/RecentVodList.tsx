import Link from "next/link";
import { Badge, Box, Center, Loader, Paper, Stack, Text } from "@mantine/core";
import {
  getStorageObjectURL,
  VOD_STATUS,
  type VodDTO,
} from "@/features/vod-dashboard/api";

export type DashboardVod = Pick<
  VodDTO,
  | "game"
  | "id"
  | "processing_progress"
  | "status"
  | "thumbnail_storage_key"
  | "title"
  | "updated_at"
>;

type RecentVodListProps = {
  emptyMessage: string;
  error: Error | null;
  isLoading: boolean;
  vods: DashboardVod[];
};

export function RecentVodList({
  emptyMessage,
  error,
  isLoading,
  vods,
}: RecentVodListProps) {
  if (isLoading) {
    return (
      <Center h={220}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (error) {
    return (
      <Text size="sm" c="red">
        Failed to load VODs
      </Text>
    );
  }

  if (vods.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Stack className="vc-recent-list" gap="sm">
      {vods.map((vod) => (
        <RecentVodRow key={vod.id} vod={vod} />
      ))}
    </Stack>
  );
}

function RecentVodRow({ vod }: { vod: DashboardVod }) {
  const thumbnailUrl = getStorageObjectURL(vod.thumbnail_storage_key);

  return (
    <Paper
      className="vc-card vc-recent-vod-row"
      component={Link}
      href={`/vods/${vod.id}`}
      radius="md"
      style={{
        color: "inherit",
        display: "grid",
        textDecoration: "none",
        width: "100%",
      }}
    >
      <Box className="vc-recent-thumbnail">
        {thumbnailUrl ? (
          <Box
            alt={`${vod.title} thumbnail`}
            className="vc-thumbnail-image"
            component="img"
            src={thumbnailUrl}
          />
        ) : (
          <Center h="100%">
            <Text size="xs" c="dimmed">
              thumbnail
            </Text>
          </Center>
        )}
      </Box>
      <Stack gap={4}>
        <Text fw={600} lineClamp={1}>
          {vod.title}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {vod.game} · updated {formatLastUpdated(vod.updated_at)}
        </Text>
        {vod.status === VOD_STATUS.processing ? (
          <Box className="vc-recent-progress">
            <Box
              className="vc-recent-progress-fill"
              style={{ width: `${vod.processing_progress}%` }}
            />
          </Box>
        ) : null}
      </Stack>
      <Badge color={getStatusColor(vod.status)} variant="light" w="fit-content">
        {getStatusLabel(vod.status)}
      </Badge>
    </Paper>
  );
}

function getStatusColor(status: VodDTO["status"]) {
  switch (status) {
    case VOD_STATUS.ready:
      return "green";
    case VOD_STATUS.failed:
      return "red";
    case VOD_STATUS.pendingUpload:
    case VOD_STATUS.uploaded:
    case VOD_STATUS.processing:
      return "yellow";
  }
}

function getStatusLabel(status: VodDTO["status"]) {
  switch (status) {
    case VOD_STATUS.pendingUpload:
      return "Pending";
    case VOD_STATUS.uploaded:
      return "Uploaded";
    case VOD_STATUS.processing:
      return "Processing";
    case VOD_STATUS.ready:
      return "Ready";
    case VOD_STATUS.failed:
      return "Failed";
  }
}

function formatLastUpdated(updatedAt: string) {
  const updatedAtDate = new Date(updatedAt);
  const diffMs = Date.now() - updatedAtDate.getTime();

  if (Number.isNaN(diffMs)) {
    return "recently";
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(updatedAtDate);
}
