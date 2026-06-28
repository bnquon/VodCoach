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
import { DRAWING_TOOL, type DrawingTool } from "../drawing/types";

type DrawingToolbarProps = {
  canUndo: boolean;
  color: string;
  drawingModeEnabled: boolean;
  isTheatreMode: boolean;
  strokeWidth: number;
  tool: DrawingTool;
  onColorChange: (color: string) => void;
  onDrawingModeChange: (enabled: boolean) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  onTheatreModeChange: (enabled: boolean) => void;
  onToolChange: (tool: DrawingTool) => void;
  onUndo: () => void;
};

export function DrawingToolbar({
  canUndo,
  color,
  drawingModeEnabled,
  isTheatreMode,
  strokeWidth,
  tool,
  onColorChange,
  onDrawingModeChange,
  onStrokeWidthChange,
  onTheatreModeChange,
  onToolChange,
  onUndo,
}: DrawingToolbarProps) {
  return (
    <Group gap="sm">
      <SegmentedControl
        data={[
          { label: "Pen", value: DRAWING_TOOL.pen },
          { label: "Rect", value: DRAWING_TOOL.rectangle },
          { label: "Circle", value: DRAWING_TOOL.circle },
          { label: "Eraser", value: DRAWING_TOOL.eraser },
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

      <Button
        size="compact-sm"
        variant={isTheatreMode ? "filled" : "light"}
        onClick={() => onTheatreModeChange(!isTheatreMode)}
      >
        {isTheatreMode ? "Exit theatre" : "Theatre mode"}
      </Button>

      <Switch
        checked={drawingModeEnabled}
        label="Drawing mode"
        onChange={(event) => onDrawingModeChange(event.currentTarget.checked)}
      />
    </Group>
  );
}
