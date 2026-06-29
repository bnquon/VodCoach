"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Center,
  Container,
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
import { VodCard } from "./VodCard";
import { useAddVodToCache, useVods } from "@/features/vod-dashboard/hooks";
import { clearAuth } from "@/lib/auth-storage";
import { useAuthUser } from "@/lib/use-auth";

export function HomeDashboard() {
  const router = useRouter();
  const user = useAuthUser();
  const { data: vods = [], error, isLoading } = useVods();
  const addVodToCache = useAddVodToCache();
  const recentVods = vods.slice(0, 3);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <main>
      <Paper className="vc-topbar" radius={0}>
        <Container size="xl" py="sm">
          <Group justify="space-between">
            <Title order={1} size="h3">
              VODCoach Studio
            </Title>
            <Group gap="sm">
              <Text size="sm" c="dimmed">
                {user?.email}
              </Text>
              <Button size="compact-sm" variant="subtle" onClick={handleLogout}>
                Logout
              </Button>
            </Group>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        <Stack gap="xl">
          <DashboardUploadCard onUploadComplete={addVodToCache} />

          <Stack gap="md">
            <Title order={2} size="h3">
              Recently updated
            </Title>
            <VodGrid
              emptyMessage="No recently updated VODs yet."
              error={error}
              isLoading={isLoading}
              vods={recentVods}
            />
          </Stack>

          <Stack gap="md">
            <Group justify="space-between" align="end">
              <Title order={2} size="h3">
                All VODs
              </Title>
              <Group>
                <TextInput placeholder="Search VODs" />
                <Select
                  placeholder="Status"
                  data={["Ready", "Processing", "Failed"]}
                  clearable
                />
              </Group>
            </Group>
            <VodGrid
              emptyMessage="Upload your first VOD to see it here."
              error={error}
              isLoading={isLoading}
              vods={vods}
            />
          </Stack>
        </Stack>
      </Container>
    </main>
  );
}

type VodGridProps = {
  emptyMessage: string;
  error: Error | null;
  isLoading: boolean;
  vods: Array<{
    game: string;
    id: string;
    status: Parameters<typeof VodCard>[0]["status"];
    title: string;
  }>;
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
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
      {vods.map((vod) => (
        <VodCard
          key={vod.id}
          game={vod.game}
          id={vod.id}
          status={vod.status}
          title={vod.title}
        />
      ))}
    </SimpleGrid>
  );
}
