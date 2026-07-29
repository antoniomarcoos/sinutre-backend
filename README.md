```markdown
# sinutre-back

Backend do **SiNutre — Sistema de Ingestão de Macronutrientes**.

Stack: **TypeScript + Express + Prisma + SQLite**.

## Funcionalidades

- Autenticação via GitHub e Google OAuth
- CRUD completo de refeições
- CRUD completo de alimentos
- Filtros por data e categoria nas refeições
- Metas personalizadas de calorias e água
- Histórico de peso e altura
- Exportação de dados em CSV
- Importação de alimentos da TACO via seed (opcional)

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Importar alimentos da TACO (opcional)

```bash
npm run alimentos:taco
```

> Obtenha uma chave gratuita em https://taco.codivatech.com/api-keys

## Banco de dados

O banco é um único arquivo em `prisma/dev.db` (ignorado pelo git). Para zerar,
basta apagar o arquivo e rodar `npx prisma migrate dev` novamente.
