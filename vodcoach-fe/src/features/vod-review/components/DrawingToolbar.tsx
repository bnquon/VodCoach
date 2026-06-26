import {
  Button,
  ColorSwatch,
  Group,
  Popover,
  SegmentedControl,
  Slider,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { HexColorPicker } from "react-colorful";

export type DrawingTool = "pen" | "rectangle" | "circle" | "eraser";

type DrawingToolbarProps = {
  canUndo: boolean;
  color: string;
  drawingModeEnabled: boolean;
  strokeWidth: number;
  tool: DrawingTool;
  onColorChange: (color: string) => void;
  onDrawingModeChange: (enabled: boolean) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  onToolChange: (tool: DrawingTool) => void;
  onUndo: () => void;
};

export function DrawingToolbar({
  canUndo,
  color,
  drawingModeEnabled,
  strokeWidth,
  tool,
  onColorChange,
  onDrawingModeChange,
  onStrokeWidthChange,
  onToolChange,
  onUndo,
}: DrawingToolbarProps) {
  return (
    <Group gap="sm">
      <SegmentedControl
        data={[
          { label: "Pen", value: "pen" },
          { label: "Rect", value: "rectangle" },
          { label: "Circle", value: "circle" },
          { label: "Eraser", value: "eraser" },
        ]}
        disabled={!drawingModeEnabled}
        size="xs"
        value={tool}
        onChange={(value) => onToolChange(value as DrawingTool)}
      />

      <Popover position="bottom-end" shadow="md" disabled={!drawingModeEnabled}>
        <Popover.Target>
          <Button
            disabled={!drawingModeEnabled}
            leftSection={<ColorSwatch color={color} size={14} />}
            size="compact-sm"
            variant="light"
          >
            Color
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <HexColorPicker color={color} onChange={onColorChange} />
        </Popover.Dropdown>
      </Popover>

      <Stack gap={2} w={120}>
        <Text size="xs" c={drawingModeEnabled ? undefined : "dimmed"}>
          Stroke {strokeWidth}px
        </Text>
        <Slider
          disabled={!drawingModeEnabled}
          max={20}
          min={1}
          size="xs"
          step={1}
          value={strokeWidth}
          onChange={onStrokeWidthChange}
        />
      </Stack>

      <Button
        disabled={!canUndo}
        size="compact-sm"
        variant="light"
        onClick={onUndo}
      >
        Undo
      </Button>

      <Switch
        checked={drawingModeEnabled}
        label="Drawing mode"
        onChange={(event) => onDrawingModeChange(event.currentTarget.checked)}
      />
    </Group>
  );
}
