/**
 * API genérica de coleções: GET (listar) e POST (criar).
 * Whitelist de coleções garante segurança básica.
 */
import { NextRequest, NextResponse } from "next/server";
import { audit, COLLECTIONS, getDB, writeDB } from "@/database/db";
import type { CollectionName } from "@/types";

export const dynamic = "force-dynamic";

function valida(collection: string): CollectionName | null {
  return (COLLECTIONS as string[]).includes(collection) ? (collection as CollectionName) : null;
}

export async function GET(_req: NextRequest, { params }: { params: { collection: string } }) {
  const col = valida(params.collection);
  if (!col) return NextResponse.json({ error: "Coleção inválida" }, { status: 404 });
  const db = getDB();
  return NextResponse.json(db[col]);
}

export async function POST(req: NextRequest, { params }: { params: { collection: string } }) {
  const col = valida(params.collection);
  if (!col) return NextResponse.json({ error: "Coleção inválida" }, { status: 404 });

  const usuario = req.headers.get("x-user") ?? "desconhecido";
  const body = await req.json();
  const db = getDB();

  // suporta criação em massa (importação via Excel envia um array)
  const itens = Array.isArray(body) ? body : [body];
  const criados: any[] = [];
  for (const item of itens) {
    const novo = {
      id: item.id ?? Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      ...item,
    };
    (db[col] as any[]).push(novo);
    criados.push(novo);
    audit(db, usuario, Array.isArray(body) ? "importar" : "criar", col, novo.id, resumo(col, novo));
  }
  writeDB(db);
  return NextResponse.json(Array.isArray(body) ? criados : criados[0], { status: 201 });
}

/** Texto curto e legível para o log de auditoria */
function resumo(col: string, item: any): string {
  return item.nome ?? item.titulo ?? item.competencia ?? item.data ?? item.dataEmissao ?? `registro em ${col}`;
}
