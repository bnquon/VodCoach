import {
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";

export default function LoginPage() {
  return (
    <main>
      <Container size={420} py="xl">
        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Title order={1} size="h2">
              Login
            </Title>
            <TextInput label="Email" placeholder="you@example.com" />
            <PasswordInput label="Password" placeholder="Password" />
            <Button>Continue</Button>
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}
