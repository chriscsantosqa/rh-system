import { cn, iniciais } from "@/lib/utils";

/** Avatar com iniciais e cor derivada do nome (sem imagens externas) */
export function Avatar({ nome, className }: { nome: string; className?: string }) {
  const hues = [243, 172, 32, 340, 200, 280, 150];
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h + nome.charCodeAt(i)) % hues.length;
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
        className
      )}
      style={{ backgroundColor: `hsl(${hues[h]} 55% 52%)` }}
      aria-hidden
    >
      {iniciais(nome)}
    </div>
  );
}
