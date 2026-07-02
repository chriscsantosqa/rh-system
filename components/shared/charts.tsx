"use client";
/**
 * Wrappers de gráficos (Recharts) com o tema do sistema.
 * Todos aceitam `data` já preparada pelas funções de lib/calc.ts.
 */
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/constants";

const eixo = { fontSize: 11, stroke: "hsl(var(--muted-foreground))" };
const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};

export function ChartCard({
  titulo, descricao, children, altura = 260,
}: {
  titulo: string; descricao?: string; children: React.ReactElement; altura?: number;
}) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
        {descricao && <CardDescription className="text-xs">{descricao}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={altura}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/** Barras verticais simples */
export function Barras({
  data, x, series, format,
}: {
  data: any[]; x: string;
  series: { key: string; nome: string; cor?: string }[];
  format?: (v: number) => string;
}) {
  return (
    <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey={x} tick={eixo} tickLine={false} axisLine={false} />
      <YAxis tick={eixo} tickLine={false} axisLine={false} />
      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => (format ? format(Number(v)) : v)} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
      {series.map((s, i) => (
        <Bar key={s.key} dataKey={s.key} name={s.nome} fill={s.cor ?? CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={42} />
      ))}
    </BarChart>
  );
}

/** Barras horizontais (rankings) */
export function BarrasH({
  data, categoria, valor, nome, format,
}: {
  data: any[]; categoria: string; valor: string; nome: string; format?: (v: number) => string;
}) {
  return (
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
      <XAxis type="number" tick={eixo} tickLine={false} axisLine={false} />
      <YAxis type="category" dataKey={categoria} tick={{ ...eixo, fontSize: 11 }} width={90} tickLine={false} axisLine={false} />
      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => (format ? format(Number(v)) : v)} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
      <Bar dataKey={valor} name={nome} radius={[0, 4, 4, 0]} maxBarSize={20}>
        {data.map((_, i) => (
          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  );
}

/** Linha (séries temporais) */
export function Linha({
  data, x, series, format,
}: {
  data: any[]; x: string;
  series: { key: string; nome: string; cor?: string }[];
  format?: (v: number) => string;
}) {
  return (
    <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey={x} tick={eixo} tickLine={false} axisLine={false} />
      <YAxis tick={eixo} tickLine={false} axisLine={false} />
      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => (format ? format(Number(v)) : v)} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
      {series.map((s, i) => (
        <Line key={s.key} type="monotone" dataKey={s.key} name={s.nome} stroke={s.cor ?? CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      ))}
    </LineChart>
  );
}

/** Pizza/rosca (distribuições) */
export function Pizza({
  data, nameKey, valueKey, format,
}: {
  data: any[]; nameKey: string; valueKey: string; format?: (v: number) => string;
}) {
  return (
    <PieChart>
      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => (format ? format(Number(v)) : v)} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius="52%" outerRadius="78%" paddingAngle={2} strokeWidth={1}>
        {data.map((entry, i) => (
          <Cell key={i} fill={entry.cor ?? CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}
