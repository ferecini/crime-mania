# Crime Mania — site

Implementação base alinhada aos documentos **REQUISITOS SITE**, **Documento mestre** e **Referências visuais do protótipo**.

## O que está pronto

- **Área pública**: quatro blocos (convite, O Crime Mania, merchandising, episódios), cabeçalho fixo com logo à direita, menu mobile, paleta e Open Sans.
- **Episódios**: catálogo e páginas com embed Spotify por episódio (IDs reais do feed RSS).
- **Shop**: caneca e camiseta (placeholders de checkout).
- **Conta**: cadastro, login e stub Google; sessão via cookie HTTP-only.
- **Membros**: navegação (Dossiês, Arquivo, Exclusivo, Juris, Comunidade, Shop, Busca, Conta, Planos), paywall por tier e tabela de benefícios.
- **Planos**: simulação de assinatura (substituir por gateway + webhooks).

## Identidade

- Coloque o arquivo **Panton Rust Extra Bold Base** em `public/fonts/` e ajuste `@font-face` em `src/app/globals.css` quando a licença estiver validada.
- Logo oficial: `public/logo-crime-mania.jpg`
- Troque a foto do bloco 1 quando a imagem oficial da host estiver disponível.

## Deploy

- **GitHub:** https://github.com/ferecini/crime-mania
- **Produção (Vercel):** https://crime-mania.vercel.app
- **Painel Vercel:** https://vercel.com/investwise/crime-mania

Push na branch `main` dispara deploy automático (GitHub conectado). Variável `AUTH_SECRET` está configurada no painel da Vercel (Production, Preview e Development).

## Desenvolvimento

```bash
npm install
npm run dev
```

Para sessão local, copie `.env.example` para `.env.local` e defina `AUTH_SECRET` (ou use `vercel env pull`).

Conta demo: `demo@crimemania.com.br` / `maniaco123`

Defina `AUTH_SECRET` em produção.

## Próximas etapas (documento mestre)

- OAuth Google real, e-mail transacional, banco de dados persistente.
- Gateway de pagamento e ACL no servidor para mídia paga.
- CMS/admin, fórum, galeria ampliável e players protegidos para Tier 2.
