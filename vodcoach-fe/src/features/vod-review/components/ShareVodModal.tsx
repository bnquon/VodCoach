"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  SHARE_PERMISSION,
  type SharePermission,
} from "@/features/vod-review/share-api";
import {
  useCreateVodShare,
  useRevokeVodShare,
  useVodShares,
} from "@/features/vod-review/share-hooks";

type ShareVodModalProps = {
  opened: boolean;
  vodID: string;
  onClose: () => void;
};

export function ShareVodModal({ opened, vodID, onClose }: ShareVodModalProps) {
  const [permission, setPermission] = useState<SharePermission>(
    SHARE_PERMISSION.view,
  );
  const [shareLink, setShareLink] = useState("");
  const shares = useVodShares(vodID);
  const createShare = useCreateVodShare(vodID);
  const revokeShare = useRevokeVodShare(vodID);

  async function handleCopyLink() {
    const share = await createShare.mutateAsync(permission);
    const link = `${window.location.origin}/shared/vods/${share.token}`;
    setShareLink(link);
    await navigator.clipboard.writeText(link);
  }

  function handleDisableSharing() {
    shares.data?.forEach((share) => {
      revokeShare.mutate(share.id);
    });
    setShareLink("");
  }

  return (
    <Modal centered opened={opened} title="Share VOD" onClose={onClose}>
      <Stack gap="md">
        <Stack gap={4}>
          <Text fw={600} size="sm">
            Link access
          </Text>
          <Text c="dimmed" size="sm">
            Anyone with this link can access only this VOD.
          </Text>
        </Stack>

        <Group align="end" grow>
          <Select
            data={[
              { label: "Viewer", value: SHARE_PERMISSION.view },
              { label: "Commenter", value: SHARE_PERMISSION.comment },
            ]}
            label="Permission"
            value={permission}
            onChange={(value) =>
              setPermission((value as SharePermission) ?? SHARE_PERMISSION.view)
            }
          />
          <Button loading={createShare.isPending} onClick={handleCopyLink}>
            Copy link
          </Button>
        </Group>

        {shareLink ? (
          <TextInput label="Copied link" readOnly value={shareLink} />
        ) : null}

        <Group justify="space-between">
          <Text c="dimmed" size="sm">
            Active links: {shares.data?.length ?? 0}
          </Text>
          <Button
            color="red"
            disabled={!shares.data?.length}
            loading={revokeShare.isPending}
            variant="subtle"
            onClick={handleDisableSharing}
          >
            Disable link access
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
