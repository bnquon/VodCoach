import Link from "next/link";
import { Badge, Paper, Stack, Text } from "@mantine/core";
import { VOD_STATUS, type VodStatus } from "@/features/vod-dashboard/api";

type DemoVodStatus = "Ready" | "Processing" | "Failed";
type CardVodStatus = DemoVodStatus | VodStatus;

type VodCardProps = {
  game: string;
  id: string;
  reviewVodID?: string;
  status: CardVodStatus;
  title: string;
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
  reviewVodID = id,
  status,
  title,
}: VodCardProps) {
  return (
    <Paper
      className="vc-card"
      component={Link}
      href={`/vods/${reviewVodID}`}
      p="sm"
      radius="md"
      style={{ color: "inherit", textDecoration: "none" }}
    >
      <Stack gap="xs">
        <Paper className="vc-thumbnail" h={96} radius="sm">
          <Stack h="100%" align="center" justify="center" gap={2}>
            <Text size="xs" c="dimmed">
              thumbnail
            </Text>
          </Stack>
        </Paper>
        <Stack gap={2}>
          <Text fw={600} size="sm" lineClamp={1}>
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {game}
          </Text>
          <Badge color={statusColor[status]} variant="light" w="fit-content">
            {statusLabel[status]}
          </Badge>
        </Stack>
      </Stack>
    </Paper>
  );
}
