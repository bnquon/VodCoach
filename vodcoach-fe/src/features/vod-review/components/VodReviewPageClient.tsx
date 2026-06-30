"use client";

import Link from "next/link";
import {
  Anchor,
  Breadcrumbs,
  Container,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { AuthGuard } from "@/components/AuthGuard";
import { useVod } from "@/features/vod-dashboard/hooks";
import { VodReviewWorkspace } from "./VodReviewWorkspace";

interface VodReviewPageClientProps {
  vodId: string;
}

export function VodReviewPageClient({ vodId }: VodReviewPageClientProps) {
  const { data: vod, error, isLoading } = useVod(vodId);
  const vodTitle = vod?.title ?? (isLoading ? "Loading VOD..." : "VOD Review");

  return (
    <AuthGuard>
      <main>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            <Stack gap={4}>
              <Breadcrumbs>
                <Anchor component={Link} href="/" size="sm">
                  Home
                </Anchor>
                <Text c="dimmed" size="sm">
                  {vodTitle}
                </Text>
              </Breadcrumbs>
              <Title order={1}>Review Workspace</Title>
              {error ? (
                <Text c="red" size="sm">
                  Failed to load VOD details
                </Text>
              ) : (
                <Text c="dimmed">VOD id: {vodId}</Text>
              )}
            </Stack>
            <VodReviewWorkspace videoId={vodId} vodTitle={vodTitle} />
          </Stack>
        </Container>
      </main>
    </AuthGuard>
  );
}
