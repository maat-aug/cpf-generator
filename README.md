# Gerador de CPFs

Gera CPFs válidos em lotes, com o estado de origem controlado por quem usa, e
exporta para `.xlsx`/`.csv` — opcionalmente no layout de uma planilha modelo.
Roda inteiro no navegador: não há back-end.

## Rodar

```sh
npm ci
npm run dev        # http://localhost:3000
```

| Script | O que faz |
|---|---|
| `dev` | servidor de desenvolvimento |
| `build` | gera o site estático em `out/` |
| `typecheck` | `tsc --noEmit` — o único gate automatizado, não há linter |
| `preview` | serve o `out/` já buildado |

Node 20 (veja `.nvmrc`). O `build` só liga o `output: "export"` em produção, então
`preview` é o único lugar onde um problema de prerender aparece antes do deploy.

## Deploy

Push na `main` dispara `.github/workflows/azure-static-web-apps.yml`, que publica
o `out/` no Azure Static Web Apps. Depende do secret
`AZURE_STATIC_WEB_APPS_API_TOKEN` no repositório. Os headers de segurança ficam em
`public/staticwebapp.config.json`, copiado para o `out/` no build.

## Sobre a dependência `xlsx`

Está fixada por URL:

```
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

A SheetJS parou de publicar no npm na 0.18.5, que tem dois advisories *high* sem
correção (prototype pollution e ReDoS) — ambos no caminho de parsing de planilha
enviada pelo usuário, que é exatamente o que este app faz. As versões corrigidas
só existem no CDN próprio deles.

Duas consequências a lembrar:

- **Dependabot e Renovate não rastreiam dependência por URL.** Não haverá aviso
  automático de uma 0.20.4. Conferir manualmente em https://cdn.sheetjs.com/.
- O `npm ci` passa a depender do `cdn.sheetjs.com` além do registry do npm.
