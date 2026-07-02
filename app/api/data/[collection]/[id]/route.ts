/**
 * API genérica de item: GET, PUT (edição parcial) e DELETE.
 */
import { NextRequest, NextResponse } from "next/server";
import { audit, COLLECTIONS, getDB, writeDB } from "@/database/db";
import type { CollectionName } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: { collection: string; id: string } };

function valida(collection: string): CollectionName | null {
  return (COLLECTIONS as string[]).includes(collection) ? (collection as CollectionName) : null;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const col = valida(params.collection);
  if (!col) return NextResponse.json({ error: "Coleção inválida" }, { status: 404 });
  const item = (getDB()[col] as any[]).find((x) => x.id === params.id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const col = valida(params.collection);
  if (!col) return NextResponse.json({ error: "Coleção inválida" }, { status: 404 });

  const usuario = req.headers.get("x-user") ?? "desconhecido";
  const body = await req.json();
  const db = getDB();
  const lista = db[col] as any[];
  const i = lista.findIndex((x) => x.id === params.id);
  if (i === -1) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  lista[i] = { ...lista[i], ...body, id: params.id };
  audit(db, usuario, "editar", col, params.id, lista[i].nome ?? lista[i].titulo ?? params.id);
  writeDB(db);
  return NextResponse.json(lista[i]);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const col = valida(params.collection);
  if (!col) return NextResponse.json({ error: "Coleção inválida" }, { status: 404 });

  const usuario = req.headers.get("x-user") ?? "desconhecido";
  const db = getDB();
  const lista = db[col] as any[];
  const item = lista.find((x) => x.id === params.id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  (db as any)[col] = lista.filter((x) => x.id !== params.id);
  audit(db, usuario, "excluir", col, params.id, item.nome ?? item.titulo ?? params.id);
  writeDB(db);
  return NextResponse.json({ ok: true });
}
