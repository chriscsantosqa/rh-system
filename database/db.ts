/**
 * Camada de persistência — banco de dados JSON local.
 * Arquivo: database/db.json (criado automaticamente com o seed na primeira execução).
 *
 * A escrita é atômica (arquivo temporário + rename) para evitar corrupção.
 * Para migrar para Prisma/SQLite no futuro, basta reimplementar estas funções.
 */
import fs from "fs";
import path from "path";
import type { AuditEntry, CollectionName, DBShape } from "@/types";
import { buildSeed } from "./seed";

const DB_DIR = path.join(process.cwd(), "database");
const DB_PATH = path.join(DB_DIR, "db.json");

/** Lê o banco (cria com seed se não existir) */
export function getDB(): DBShape {
  if (!fs.existsSync(DB_PATH)) {
    const seed = buildSeed();
    writeDB(seed);
    return seed;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const db = JSON.parse(raw) as DBShape;
  // garante que todas as coleções existam (compatibilidade com backups antigos)
  const empty = emptyDB();
  for (const k of Object.keys(empty) as CollectionName[]) {
    if (!Array.isArray(db[k])) (db as any)[k] = [];
  }
  return db;
}

/** Escrita atômica do banco */
export function writeDB(db: DBShape): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH);
}

/** Restaura o banco a partir de um backup JSON (valida a estrutura básica) */
export function restoreDB(json: unknown): void {
  if (typeof json !== "object" || json === null) throw new Error("Backup inválido");
  const empty = emptyDB();
  const db = { ...empty } as DBShape;
  for (const k of Object.keys(empty) as CollectionName[]) {
    const v = (json as Record<string, unknown>)[k];
    (db as any)[k] = Array.isArray(v) ? v : [];
  }
  if (db.funcionarios.length === 0 && db.lojas.length === 0) {
    throw new Error("Backup não contém dados reconhecíveis");
  }
  writeDB(db);
}

/** Apaga o banco e recria o seed (reset de demonstração) */
export function resetDB(): DBShape {
  const seed = buildSeed();
  writeDB(seed);
  return seed;
}

/** Registra uma entrada de auditoria (quem alterou o quê e quando) */
export function audit(
  db: DBShape,
  usuario: string,
  acao: AuditEntry["acao"],
  colecao: string,
  itemId: string,
  detalhe: string
): void {
  db.auditoria.unshift({
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    dataHora: new Date().toISOString(),
    usuario,
    acao,
    colecao,
    itemId,
    detalhe,
  });
  // mantém no máximo 2000 registros
  if (db.auditoria.length > 2000) db.auditoria = db.auditoria.slice(0, 2000);
}

function emptyDB(): DBShape {
  return {
    lojas: [], horarios: [], funcionarios: [], escalas: [], bancoHoras: [],
    atestados: [], vtConfigs: [], vtPagamentos: [], asos: [], documentos: [],
    usuarios: [], feriados: [], auditoria: [],
  };
}

export const COLLECTIONS: CollectionName[] = [
  "lojas", "horarios", "funcionarios", "escalas", "bancoHoras", "atestados",
  "vtConfigs", "vtPagamentos", "asos", "documentos", "usuarios", "feriados", "auditoria",
];
