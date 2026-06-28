"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Container,
  Group,
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
import { clearAuth } from "@/lib/auth-storage";
import { useAuthUser } from "@/lib/use-auth";

const recentVods = [
  { id: "match-1", title: "Match 1", game: "Valorant", status: "Ready" },
  {
    id: "match-2",
    title: "Match 2",
    game: "Apex Legends",
    status: "Processing",
  },
  { id: "match-3", title: "Match 3", game: "Overwatch 2", status: "Failed" },
] as const;

const allVods = [
  ...recentVods,
  { id: "match-4", title: "Ranked Review", game: "Valorant", status: "Ready" },
  {
    id: "match-5",
    title: "Scrim Set",
    game: "Counter-Strike 2",
    status: "Processing",
  },
  { id: "match-6", title: "Endgame Review", game: "Fortnite", status: "Ready" },
] as const;

export function HomeDashboard() {
  const router = useRouter();
  const user = useAuthUser();

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <main>
      <Paper withBorder radius={0}>
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
          <DashboardUploadCard />

          <Stack gap="md">
            <Title order={2} size="h3">
              Recently updated
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {recentVods.map((vod) => (
                <VodCard key={vod.id} {...vod} />
              ))}
            </SimpleGrid>
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
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {allVods.map((vod) => (
                <VodCard key={vod.id} {...vod} />
              ))}
            </SimpleGrid>
          </Stack>
        </Stack>
      </Container>
    </main>
  );
}
