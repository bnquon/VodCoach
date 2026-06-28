import Link from "next/link";
import { Badge, Paper, Stack, Text } from "@mantine/core";
import { TEST_VOD_ID } from "@/features/vod-review/api";

type VodStatus = "Ready" | "Processing" | "Failed";

type VodCardProps = {
  game: string;
  id: string;
  status: VodStatus;
  title: string;
};

const statusColor: Record<VodStatus, string> = {
  Ready: "green",
  Processing: "yellow",
  Failed: "red",
};

export function VodCard({ game, status, title }: VodCardProps) {
  return (
    <Paper
      className="vc-card"
      component={Link}
      href={`/vods/${TEST_VOD_ID}`}
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
            {status}
          </Badge>
        </Stack>
      </Stack>
    </Paper>
  );
}
