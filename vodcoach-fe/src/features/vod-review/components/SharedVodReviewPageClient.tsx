"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { getShareGuestName, setShareGuestName } from "@/lib/share-storage";
import { SHARE_PERMISSION } from "../share-api";
import { useCreateShareSession, useSharedVod } from "../share-hooks";
import { SharedVodReviewWorkspace } from "./SharedVodReviewWorkspace";

type SharedVodReviewPageClientProps = {
  shareToken: string;
};

export function SharedVodReviewPageClient({
  shareToken,
}: SharedVodReviewPageClientProps) {
  const [guestName, setGuestName] = useState(
    () => getShareGuestName(shareToken) ?? "",
  );
  const [draftGuestName, setDraftGuestName] = useState(
    () => getShareGuestName(shareToken) ?? "",
  );
  const [hasShareSession, setHasShareSession] = useState(false);
  const createSession = useCreateShareSession(shareToken);
  const createShareSession = createSession.mutate;
  const sharedVod = useSharedVod(shareToken, hasShareSession);
  const permission = createSession.data?.permission;
  const canComment = permission === SHARE_PERMISSION.comment;

  useEffect(() => {
    if (guestName) {
      createShareSession(guestName, {
        onSuccess: () => setHasShareSession(true),
      });
    }
  }, [createShareSession, guestName]);

  function handleStartSession() {
    const trimmedGuestName = draftGuestName.trim();
    if (!trimmedGuestName) {
      return;
    }

    createSession.mutate(trimmedGuestName, {
      onSuccess: () => {
        setShareGuestName(shareToken, trimmedGuestName);
        setGuestName(trimmedGuestName);
        setHasShareSession(true);
      },
    });
  }

  const shouldShowNameModal = !guestName;

  return (
    <main className="vc-review-page">
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Stack gap={4}>
            <Text c="dimmed" size="sm">
              Shared VOD
            </Text>
            <Title order={1}>{sharedVod.data?.title ?? "VOD Review"}</Title>
            {guestName ? (
              <Text c="dimmed" size="sm">
                Viewing as {guestName}
              </Text>
            ) : null}
          </Stack>

          {createSession.error ? (
            <Text c="red" size="sm">
              This share link is invalid or no longer available.
            </Text>
          ) : !hasShareSession || sharedVod.isLoading ? (
            <Center h={360}>
              <Loader size="sm" />
            </Center>
          ) : sharedVod.error ? (
            <Text c="red" size="sm">
              This share link is invalid or no longer available.
            </Text>
          ) : (
            <SharedVodReviewWorkspace
              canComment={canComment}
              shareToken={shareToken}
            />
          )}
        </Stack>
      </Container>

      <Modal
        centered
        opened={shouldShowNameModal}
        title="Enter your name"
        onClose={() => {}}
      >
        <Stack gap="md">
          <Text size="sm">
            Choose the name that will appear on notes and drawings you add.
          </Text>
          <TextInput
            autoFocus
            label="Name"
            value={draftGuestName}
            onChange={(event) => setDraftGuestName(event.currentTarget.value)}
          />
          {createSession.error ? (
            <Text c="red" size="sm">
              This share link is invalid or no longer available.
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button
              disabled={!draftGuestName.trim()}
              loading={createSession.isPending}
              onClick={handleStartSession}
            >
              Continue
            </Button>
          </Group>
        </Stack>
      </Modal>
    </main>
  );
}
