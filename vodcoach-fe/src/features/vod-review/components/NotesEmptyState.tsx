import { Center, Text } from "@mantine/core";

type NotesEmptyStateProps = {
  message: string;
};

export function NotesEmptyState({ message }: NotesEmptyStateProps) {
  return (
    <Center h="100%" mih={140}>
      <Text ta="center" size="sm" c="dimmed">
        {message}
      </Text>
    </Center>
  );
}
