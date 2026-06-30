"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ActionIcon,
  Anchor,
  Button,
  Breadcrumbs,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { PencilLine } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useUpdateVod, useVod } from "@/features/vod-dashboard/hooks";
import { VodReviewWorkspace } from "./VodReviewWorkspace";

interface VodReviewPageClientProps {
  vodId: string;
}

export function VodReviewPageClient({ vodId }: VodReviewPageClientProps) {
  const { data: vod, error, isLoading } = useVod(vodId);
  const updateVod = useUpdateVod();
  const vodTitle = vod?.title ?? (isLoading ? "Loading VOD..." : "VOD Review");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const canSaveTitle = draftTitle.trim().length > 0;

  function handleStartTitleEdit() {
    setDraftTitle(vodTitle);
    setIsEditingTitle(true);
  }

  function handleCancelTitleEdit() {
    setDraftTitle("");
    setIsEditingTitle(false);
  }

  function handleSaveTitleEdit() {
    if (!canSaveTitle) {
      return;
    }

    updateVod.mutate(
      {
        vodID: vodId,
        title: draftTitle.trim(),
      },
      {
        onSuccess: () => setIsEditingTitle(false),
      },
    );
  }

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
              {isEditingTitle ? (
                <Group align="end" gap="xs">
                  <TextInput
                    aria-label="VOD title"
                    value={draftTitle}
                    onChange={(event) =>
                      setDraftTitle(event.currentTarget.value)
                    }
                  />
                  <Button
                    disabled={!canSaveTitle}
                    loading={updateVod.isPending}
                    size="compact-sm"
                    onClick={handleSaveTitleEdit}
                  >
                    Save
                  </Button>
                  <Button
                    size="compact-sm"
                    variant="subtle"
                    onClick={handleCancelTitleEdit}
                  >
                    Cancel
                  </Button>
                </Group>
              ) : (
                <Group align="center" gap="xs">
                  <Title order={1}>{vodTitle}</Title>
                  <ActionIcon
                    aria-label="Edit VOD title"
                    disabled={!vod}
                    size="sm"
                    variant="subtle"
                    onClick={handleStartTitleEdit}
                  >
                    <PencilLine size={16} strokeWidth={2} />
                  </ActionIcon>
                </Group>
              )}
              {error ? (
                <Text c="red" size="sm">
                  Failed to load VOD details
                </Text>
              ) : (
                <Text c="dimmed">VOD id: {vodId}</Text>
              )}
            </Stack>
            <VodReviewWorkspace videoId={vodId} />
          </Stack>
        </Container>
      </main>
    </AuthGuard>
  );
}
