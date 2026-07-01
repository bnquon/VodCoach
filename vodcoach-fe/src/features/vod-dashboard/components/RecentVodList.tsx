import Link from "next/link";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { EllipsisVertical } from "lucide-react";
import {
  getStorageObjectURL,
  VOD_STATUS,
  type VodDTO,
} from "@/features/vod-dashboard/api";

export type DashboardVod = Pick<
  VodDTO,
  | "game"
  | "id"
  | "error_message"
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
  onDeleteVodRequest?: (vod: DashboardVod) => void;
  onEditVodRequest?: (vod: DashboardVod) => void;
  onRetryLoad?: () => void;
  onRetryVodRequest?: (vod: DashboardVod) => void;
  vods: DashboardVod[];
};

export function RecentVodList({
  emptyMessage,
  error,
  isLoading,
  onDeleteVodRequest,
  onEditVodRequest,
  onRetryLoad,
  onRetryVodRequest,
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
      <Group justify="space-between">
        <Text size="sm" c="red">
          Failed to load VODs
        </Text>
        {onRetryLoad ? (
          <Button size="compact-xs" variant="light" onClick={onRetryLoad}>
            Retry
          </Button>
        ) : null}
      </Group>
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
        <RecentVodRow
          key={vod.id}
          onDeleteRequest={
            onDeleteVodRequest ? () => onDeleteVodRequest(vod) : undefined
          }
          onEditRequest={
            onEditVodRequest ? () => onEditVodRequest(vod) : undefined
          }
          onRetryRequest={
            onRetryVodRequest ? () => onRetryVodRequest(vod) : undefined
          }
          vod={vod}
        />
      ))}
    </Stack>
  );
}

function RecentVodRow({
  onDeleteRequest,
  onEditRequest,
  onRetryRequest,
  vod,
}: {
  onDeleteRequest?: () => void;
  onEditRequest?: () => void;
  onRetryRequest?: () => void;
  vod: DashboardVod;
}) {
  const thumbnailUrl = getStorageObjectURL(
    vod.thumbnail_storage_key,
    vod.updated_at,
  );
  const canDelete =
    vod.status === VOD_STATUS.ready || vod.status === VOD_STATUS.failed;

  return (
    <Paper className="vc-recent-vod-row" radius="md">
      <Box
        className="vc-recent-vod-link"
        component={Link}
        href={`/vods/${vod.id}`}
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
        <Stack gap={4} miw={0}>
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
          {vod.status === VOD_STATUS.failed && vod.error_message ? (
            <Text c="red" lineClamp={1} size="xs">
              {vod.error_message}
            </Text>
          ) : null}
        </Stack>
      </Box>
      <Badge color={getStatusColor(vod.status)} variant="light" w="fit-content">
        {getStatusLabel(vod.status)}
      </Badge>
      {vod.status === VOD_STATUS.failed && onRetryRequest ? (
        <Button
          size="compact-xs"
          variant="light"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRetryRequest();
          }}
        >
          Retry
        </Button>
      ) : null}
      {onDeleteRequest ? (
        <RecentVodMenu
          canDelete={canDelete}
          onDeleteRequest={onDeleteRequest}
          onEditRequest={onEditRequest}
        />
      ) : null}
    </Paper>
  );
}

function RecentVodMenu({
  canDelete,
  onDeleteRequest,
  onEditRequest,
}: {
  canDelete: boolean;
  onDeleteRequest: () => void;
  onEditRequest?: () => void;
}) {
  return (
    <Menu position="bottom-end" shadow="md" width={180}>
      <Menu.Target>
        <ActionIcon
          aria-label="VOD actions"
          className="vc-vod-action-button"
          size="sm"
          variant="subtle"
        >
          <EllipsisVertical size={16} strokeWidth={2} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown className="vc-vod-action-menu">
        {onEditRequest ? (
          <Menu.Item className="vc-vod-action-item" onClick={onEditRequest}>
            Edit
          </Menu.Item>
        ) : null}
        <Menu.Item
          className="vc-vod-action-delete"
          disabled={!canDelete}
          onClick={onDeleteRequest}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
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
