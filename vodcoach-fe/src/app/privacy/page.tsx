import { Container, Stack, Text, Title } from "@mantine/core";

export default function PrivacyPage() {
  return (
    <main>
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Stack gap={6}>
            <Title order={1}>Privacy Policy</Title>
            <Text c="dimmed" size="sm">
              Last updated: June 30, 2026
            </Text>
          </Stack>

          <Text>
            VODCoach stores account information, uploaded VOD metadata, notes,
            drawings, and share-link settings so the product can provide VOD
            review and collaboration features.
          </Text>

          <Text>
            Uploaded videos and thumbnails are stored with our media storage
            provider. Private playback uses temporary signed URLs, and shared
            access is limited to the permissions configured by the VOD owner.
          </Text>

          <Text>
            We do not sell personal information. We may use basic operational
            data to secure the service, troubleshoot issues, prevent abuse, and
            improve reliability.
          </Text>

          <Text>
            You can delete your VODs from the dashboard. Deleting a VOD also
            removes its related notes, drawings, video, and thumbnail according
            to the product deletion flow.
          </Text>

          <Text>
            For privacy questions or data requests, use the contact form in the
            footer.
          </Text>
        </Stack>
      </Container>
    </main>
  );
}
