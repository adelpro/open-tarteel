import { Switch } from '@/components/ui/switch';
import useDirection from '@/hooks/use-direction';

type ToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};
export function ToggleRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: Readonly<ToggleRowProps>) {
  const { dir } = useDirection();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 text-muted-foreground">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <Switch dir={dir} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
