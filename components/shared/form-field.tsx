import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Campo de formulário com label consistente */
export function Field({
  label, children, className, obrigatorio,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  obrigatorio?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">
        {label} {obrigatorio && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
