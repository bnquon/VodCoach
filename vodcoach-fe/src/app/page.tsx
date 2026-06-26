import { Badge, Container, Stack, Text, Title } from "@mantine/core";
import { VodReviewWorkspace } from "@/features/vod-review/components/VodReviewWorkspace";

export default function Home() {
  return (
    <main>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Stack gap="md">
            <Badge color="green" variant="light" w="fit-content">
              VODCoach Studio
            </Badge>
            <Title order={1} maw={720}>
              Gameplay review workspace
            </Title>
            <Text c="dimmed" maw={640}>
              Start with a local MP4 upload. The review tools for timestamped
              notes and frame annotations will build from this screen.
            </Text>
          </Stack>

          <VodReviewWorkspace />
        </Stack>
      </Container>
    </main>
  );
}
