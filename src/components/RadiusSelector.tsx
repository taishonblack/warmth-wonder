import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProximityRadius, RADIUS_OPTIONS } from "@/hooks/useProximitySettings";

interface RadiusSelectorProps {
  value: ProximityRadius;
  onChange: (value: ProximityRadius) => void;
}

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(parseInt(v, 10) as ProximityRadius)}
    >
      <SelectTrigger className="w-[100px] h-8 text-xs bg-background border-input">
        <SelectValue placeholder="Radius" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {RADIUS_OPTIONS.map((r) => (
          <SelectItem key={r} value={r.toString()}>
            {r} miles
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
