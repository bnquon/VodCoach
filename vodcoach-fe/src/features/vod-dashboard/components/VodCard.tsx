import Link from "next/link";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { EllipsisVertical } from "lucide-react";
import { VOD_STATUS, type VodStatus } from "@/features/vod-dashboard/api";

type DemoVodStatus = "Ready" | "Processing" | "Failed";
type CardVodStatus = DemoVodStatus | VodStatus;

type VodCardProps = {
  game: string;
  id: string;
  reviewVodID?: string;
  status: CardVodStatus;
  thumbnailUrl?: string | null;
  title: string;
  onDeleteRequest?: () => void;
  onEditRequest?: () => void;
};

const statusColor: Record<CardVodStatus, string> = {
  Ready: "green",
  Processing: "yellow",
  Failed: "red",
  [VOD_STATUS.pendingUpload]: "yellow",
  [VOD_STATUS.uploaded]: "blue",
  [VOD_STATUS.processing]: "yellow",
  [VOD_STATUS.ready]: "green",
  [VOD_STATUS.failed]: "red",
};

const statusLabel: Record<CardVodStatus, string> = {
  Ready: "Ready",
  Processing: "Processing",
  Failed: "Failed",
  [VOD_STATUS.pendingUpload]: "Pending upload",
  [VOD_STATUS.uploaded]: "Uploaded",
  [VOD_STATUS.processing]: "Processing",
  [VOD_STATUS.ready]: "Ready",
  [VOD_STATUS.failed]: "Failed",
};

export function VodCard({
  game,
  id,
  onDeleteRequest,
  onEditRequest,
  reviewVodID = id,
  status,
  thumbnailUrl,
  title,
}: VodCardProps) {
  const canDelete = status === VOD_STATUS.ready || status === VOD_STATUS.failed;

  return (
    <Paper className="vc-card vc-vod-card" p="sm" radius="md">
      <Stack gap="xs" h="100%">
        <Box
          className="vc-card-link"
          component={Link}
          href={`/vods/${reviewVodID}`}
        >
          <Paper className="vc-thumbnail" radius="sm">
            {thumbnailUrl ? (
              <Box
                alt={`${title} thumbnail`}
                className="vc-thumbnail-image"
                component="img"
                src={thumbnailUrl}
              />
            ) : (
              <Stack h="100%" align="center" justify="center" gap={2}>
                <Text size="xs" c="dimmed">
                  thumbnail
                </Text>
              </Stack>
            )}
          </Paper>
        </Box>
        <Group align="start" gap="xs" justify="space-between" wrap="nowrap">
          <Box
            className="vc-card-link"
            component={Link}
            flex="1 1 auto"
            href={`/vods/${reviewVodID}`}
            miw={0}
          >
            <Stack gap={2}>
              <Text fw={600} size="sm" lineClamp={1}>
                {title}
              </Text>
              <Text size="xs" c="dimmed">
                {game}
              </Text>
              <Badge
                mt={6}
                color={statusColor[status]}
                variant="light"
                w="fit-content"
              >
                {statusLabel[status]}
              </Badge>
            </Stack>
          </Box>
          {onDeleteRequest ? (
            <VodCardMenu
              canDelete={canDelete}
              onDeleteRequest={onDeleteRequest}
              onEditRequest={onEditRequest}
            />
          ) : null}
        </Group>
      </Stack>
    </Paper>
  );
}

function VodCardMenu({
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
