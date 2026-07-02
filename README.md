# RH Lupatelli & Enlace — Mini ERP de RH

Sistema web completo de gestão de RH para as lojas **Lupatelli** e **Enlace**
(≈30 colaboradoras), construído com Next.js 14, React 18, TypeScript,
Tailwind CSS, componentes padrão shadcn/ui, Lucide Icons e Recharts.

## Como executar

Pré-requisito: **Node.js 18.17+** (recomendado Node 20).

```bash
npm install
npm run dev
```

Abra **http://localhost:3000**. Na primeira execução o banco é criado
automaticamente em `database/db.json` com todos os dados de exemplo
(lojas, colaboradoras, horários, escala de julho/2026, atestados, VT, ASOs).

Na tela de login escolha um perfil (autenticação local de demonstração):

| Usuário        | Papel         | O que demonstra                                  |
|----------------|---------------|--------------------------------------------------|
| Administrador  | Admin         | Acesso total (usuários, backup, auditoria)       |
| João Pedro     | RH            | Edição completa, VT, configurações, auditoria    |
| Marina         | RH            | Idem                                             |
| Dani Matias    | Gerente       | Enxerga/edita apenas a loja Lupatelli Plaza      |
| Diretoria      | Consulta      | Somente leitura (botões de edição ocultos)       |

## Módulos

- **Dashboard** — cards (colaboradoras, atestados/mês, dias perdidos, VT, afastadas, férias próximas, ASO vencendo, aniversariantes), 7 gráficos, ranking de lojas e filtros por mês/período/loja/colaboradora.
- **Funcionários** — cadastro completo (loja, gerente, horário, escala, dados pessoais, status, férias), ficha com abas (dados, atestados, VT, ASOs, documentos, escala) e alertas por colaboradora.
- **Escalas** — grade mensal clicável (trabalho, folga, férias, atestado, afastamento, troca, extra), mudança de horário por dia, observações, geração automática de escala padrão (6x1 com domingos alternados e folga rotativa; escritório 5x2), resumo por colaboradora, banco de horas e cadastro de horários.
- **Vale Transporte** — tarifas por colaboradora (ida, volta, integrações, conduções/dia), cálculo automático `dias efetivamente trabalhados × custo/dia` a partir da escala (descontando férias/atestados/afastamentos/folgas), pagamento com divisão **cartão VT + PIX validada** (o sistema impede divisão diferente do total), histórico com responsável e observações, dashboard específico e exportações.
- **Atestados** — cadastro com CID/médico/CRM/hospital/tipo e upload do arquivo; cálculos automáticos (dias perdidos, por mês/ano/colaboradora/loja/CID, consecutivos, acumulados); alertas (3+ em 6 meses, >15 dias, >30 dias, INSS); dashboard, ranking e exportações.
- **Medicina do Trabalho** — ASOs admissional/periódico/demissional/mudança de função/retorno, com alertas de vencido/vencendo (30 dias).
- **Documentos** — upload por tipo (contrato, advertência, suspensão, ASO, pessoal, treinamento, certificado) com histórico disciplinar por colaboradora.
- **Indicadores** — absenteísmo, turnover 12m, dias/horas perdidas, atestados e VT por loja/gerente/colaboradora, headcount por status (fórmulas descritas na tela).
- **Relatórios** — Excel e PDF de funcionários, atestados, VT, lojas, escalas, indicadores e banco de horas.
- **Configurações** — lojas, horários, feriados, usuários/permissões, importação de funcionários via Excel (com modelo para download), backup/restauração do banco, reset de demonstração e **log de auditoria** (quem alterou o quê e quando).
- **Extras** — tema claro/escuro, busca global (nome, loja, cargo, CID, gerente, CPF), notificações no topo (ASO, férias, experiência 30/45/90, atestados recorrentes, VT pendente), confirmação antes de excluir, toasts, menu lateral recolhível, responsivo.

## Arquitetura

```
app/            páginas (App Router) + API routes (REST genérica por coleção)
components/     ui/ (shadcn), layout/, shared/ (DataTable, gráficos...), features/
database/       db.ts (persistência JSON atômica) + seed.ts (dados reais)
hooks/          use-data.ts (cache global + escopo por papel)
lib/            auth (RBAC), calc.ts (regras de negócio), utils, constants
services/       api.ts (cliente HTTP tipado, header de auditoria)
types/          modelos TypeScript de todas as entidades
utils/          export.ts (Excel/PDF/importação)
```

**Banco de dados:** JSON local (`database/db.json`) com escrita atômica —
escolhido pela previsibilidade do `npm install && npm run dev` sem etapa de
migração. A camada `database/db.ts` + rotas REST isolam a persistência:
migrar para **Prisma + SQLite/Postgres** exige mexer apenas nesses arquivos.
Backup = download do JSON; restauração = upload.

> Os CPFs, RGs, contatos e CIDs do seed são **fictícios**.

## Funcionalidades futuras sugeridas

1. Módulo de férias com períodos aquisitivos/concessivos e programação anual.
2. Controle de experiência 30/45/90 dias com aba própria (alertas já implementados).
3. Trilhas de treinamento / Academia de Líderes com certificados e conclusão.
4. Gestão de EPIs e uniformes com termo de entrega assinado.
5. Integração com ponto eletrônico para importar marcações e alimentar VT/banco de horas.
6. Importação Excel também para atestados e escalas.
7. Autenticação real (NextAuth) com senha/2FA e permissões por campo.
8. Migração para Prisma + PostgreSQL para acesso multiusuário simultâneo.
9. Notificações por e-mail/WhatsApp para ASOs e experiências vencendo.
10. App/versão mobile para gerentes registrarem trocas de escala na loja.
