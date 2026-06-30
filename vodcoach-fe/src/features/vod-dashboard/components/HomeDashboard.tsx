"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Box,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DashboardUploadCard } from "./DashboardUploadCard";
import { RecentVodList, type DashboardVod } from "./RecentVodList";
import { VodCard } from "./VodCard";
import {
  getStorageObjectURL,
  VOD_STATUS,
  type VodStatus,
} from "@/features/vod-dashboard/api";
import { useAddVodToCache, useVods } from "@/features/vod-dashboard/hooks";
import { clearAuth } from "@/lib/auth-storage";
import { useAuthUser } from "@/lib/use-auth";

export function HomeDashboard() {
  const router = useRouter();
  const user = useAuthUser();
  const { data: vods = [], error, isLoading } = useVods();
  const addVodToCache = useAddVodToCache();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VodStatus | null>(null);
  const recentVods = vods.slice(0, 4);
  const filteredVods = useMemo(
    () => filterVods(vods, searchQuery, statusFilter),
    [searchQuery, statusFilter, vods],
  );

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <main className="vc-dashboard-app">
      <header className="vc-dashboard-topbar">
        <Group gap="sm">
          <Title order={1} size="h3">
            VODCoach Studio
          </Title>
        </Group>
        <Group className="vc-dashboard-user-nav">
          <Text size="sm" c="dimmed">
            {user?.email}
          </Text>
          <Button size="compact-sm" variant="subtle" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </header>

      <Stack gap="xl">
        <Stack className="vc-dashboard-heading" gap={4}>
          <Title order={2}>Your VOD library</Title>
          <Text c="dimmed">
            Upload gameplay, review key moments, and turn notes into coaching
            reports.
          </Text>
        </Stack>

        <Box className="vc-dashboard-top-grid">
          <DashboardUploadCard onUploadComplete={addVodToCache} />

          <Paper className="vc-elevated-card vc-recent-panel" radius="md">
            <Group className="vc-section-title" justify="space-between">
              <Stack gap={4}>
                <Title order={3} size="h3">
                  Recently updated
                </Title>
                <Text size="sm" c="dimmed">
                  Jump back into reviews that are ready, processing, or need
                  attention.
                </Text>
              </Stack>
            </Group>
            <RecentVodList
              emptyMessage="No recently updated VODs yet."
              error={error}
              isLoading={isLoading}
              vods={recentVods}
            />
          </Paper>
        </Box>

        <Stack className="vc-dashboard-library" gap="md">
          <Group
            className="vc-library-header"
            justify="space-between"
            align="end"
          >
            <Stack className="vc-section-title" gap={4}>
              <Title order={3} size="h3">
                All VODs
              </Title>
              <Text size="sm" c="dimmed">
                Your full review collection.
              </Text>
            </Stack>
            <Group className="vc-dashboard-filters">
              <TextInput
                placeholder="Search VODs"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
              />
              <Select
                placeholder="Status"
                data={[
                  { label: "Ready", value: VOD_STATUS.ready },
                  { label: "Processing", value: VOD_STATUS.processing },
                  { label: "Failed", value: VOD_STATUS.failed },
                  { label: "Uploaded", value: VOD_STATUS.uploaded },
                  { label: "Pending upload", value: VOD_STATUS.pendingUpload },
                ]}
                value={statusFilter}
                clearable
                onChange={(value) => setStatusFilter(value as VodStatus | null)}
              />
            </Group>
          </Group>
          <VodGrid
            emptyMessage={getVodGridEmptyMessage(
              vods.length,
              searchQuery,
              statusFilter,
            )}
            error={error}
            isLoading={isLoading}
            vods={filteredVods}
          />
        </Stack>
      </Stack>
    </main>
  );
}

function filterVods(
  vods: DashboardVod[],
  searchQuery: string,
  statusFilter: VodStatus | null,
) {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  return vods.filter((vod) => {
    const matchesSearch =
      normalizedSearchQuery === "" ||
      vod.title.toLowerCase().includes(normalizedSearchQuery) ||
      vod.game.toLowerCase().includes(normalizedSearchQuery);
    const matchesStatus = !statusFilter || vod.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

function getVodGridEmptyMessage(
  vodCount: number,
  searchQuery: string,
  statusFilter: VodStatus | null,
) {
  if (vodCount === 0) {
    return "Upload your first VOD to see it here.";
  }

  if (searchQuery.trim() || statusFilter) {
    return "No VODs match those filters.";
  }

  return "Upload your first VOD to see it here.";
}

type VodGridProps = {
  emptyMessage: string;
  error: Error | null;
  isLoading: boolean;
  vods: DashboardVod[];
};

function VodGrid({ emptyMessage, error, isLoading, vods }: VodGridProps) {
  if (isLoading) {
    return (
      <Center className="vc-card" h={160}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (error) {
    return (
      <Paper className="vc-card" p="md" radius="md">
        <Text size="sm" c="red">
          Failed to load VODs
        </Text>
      </Paper>
    );
  }

  if (vods.length === 0) {
    return (
      <Paper className="vc-card" p="md" radius="md">
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      </Paper>
    );
  }

  return (
    <SimpleGrid
      className="vc-vod-grid"
      cols={{ base: 1, sm: 2, md: 4 }}
      spacing="md"
    >
      {vods.map((vod) => (
        <VodCard
          key={vod.id}
          game={vod.game}
          id={vod.id}
          status={vod.status}
          thumbnailUrl={getStorageObjectURL(vod.thumbnail_storage_key)}
          title={vod.title}
        />
      ))}
    </SimpleGrid>
  );
}
