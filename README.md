# ange-website

Lo spazio personale di un CTO: **note tecniche, un'ossessione per il caffè e qualche pensiero sparso**.
Nessun vincolo su _cosa_ scrivere — ma tutto resta categorizzato, e le categorie diventano la mappa della home.

## L'idea

Tre esperienze, un'estetica calda e accogliente:

1. **Home = filesystem a blocchi.** Un grande quadrato suddiviso in una _treemap_: ogni blocco è una
   categoria, **grande quanto la quantità di contenuti** che contiene. Clic → entri nella cartella.
2. **Listing "filesystem".** I post elencati come file (`slug.md`, cartella = categoria, peso = tempo di
   lettura, data), con percorso in stile shell. Clic → al post.
3. **Pensieri = carosello.** Card tweet-size, scorrevoli con swipe / frecce, **fuori** da ogni struttura a
   filesystem: solo il flusso.

## Stack

| Layer     | Tecnologia                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | Vite + React 19 + TypeScript + Tailwind v4 (SPA)                   |
| Backend   | Strapi v5 (CMS headless)                                           |
| Database  | PostgreSQL 16                                                      |
| Runtime   | Docker Compose (tutto e tre i servizi)                             |
| Extra FE  | react-router, TanStack Query, framer-motion, embla, d3-hierarchy  |

```
ange-website/
├── backend/            # Strapi 5: content types, seed, config
├── frontend/           # React SPA: treemap, listing, post, pensieri
├── docker-compose.yml  # db + backend + frontend
└── README.md
```

## Porte

Scelte per non collidere con gli altri stack già attivi sulla macchina.

| Servizio          | URL                              | Container             |
| ----------------- | -------------------------------- | --------------------- |
| Frontend (Vite)   | http://localhost:5175            | `ange_website_frontend` |
| Strapi (API+admin)| http://localhost:1338            | `ange_website_backend`  |
| PostgreSQL        | localhost:5434                   | `ange_website_db`       |

## Avvio rapido

```bash
docker compose up -d
```

Al **primo avvio** i container installano le dipendenze al loro interno (~1–3 min) e Strapi crea le
tabelle + esegue il seed con contenuti d'esempio. Poi:

- **Sito**: http://localhost:5175
- **Admin Strapi**: http://localhost:1338/admin → crea il tuo primo utente amministratore
  (l'API pubblica funziona già grazie ai permessi impostati dal seed; l'admin serve solo per scrivere).

Per seguire i log:

```bash
docker compose logs -f backend     # o frontend, db
```

Per fermare tutto (i dati restano nel volume `pgdata`):

```bash
docker compose down
```

## Modello dei contenuti

| Tipo                  | Campi principali                                                                     |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Category**          | `name`, `slug`, `description`, `color`, `accent`, `icon`, `order` — i blocchi della home |
| **Post**              | `title`, `slug`, `excerpt`, `content` (markdown), `cover`, `category`, `tags`, `readingTime`, `featured` |
| **Thought** (pensiero)| `body` (≤280), `mood` — la card del carosello                                        |
| **Profile** (single)  | `name`, `role`, `tagline`, `bio`, `avatar`, `location`, `email`, `socials[]`         |

Il **seed** (`backend/src/seed.ts`) gira nel `bootstrap` di Strapi: imposta i permessi pubblici di lettura
e, **solo se il database è vuoto**, inserisce categorie/post/pensieri/profilo d'esempio (in italiano).
Per ripartire da zero: `docker compose down -v` (azzera anche il DB) e risali.

## Sviluppo

Frontend e backend girano in Docker con il sorgente **bind-montato**, quindi le modifiche ai file fanno
hot-reload automatico (Vite HMR e Strapi watch).

Per lavorarci **sull'host** invece che in Docker:

```bash
# Frontend (Node 20–24 ok)
cd frontend && npm install && VITE_PORT=5175 npm run dev

# Backend (Node 20–24; richiede il DB su :5434 → DATABASE_HOST=127.0.0.1 in backend/.env)
cd backend && npm install && npm run develop
```

> Nota: i dev server sono processi a lunga durata; per questo lo stack li tiene in Docker (gestiti dal
> daemon, restano vivi e rispecchiano la produzione).

### Variabili d'ambiente

- `backend/.env` — connessione DB + secret Strapi. **Rigenera i secret per la produzione**
  (`openssl rand -base64 32`). In Docker, host/porta del DB sono sovrascritti dal compose (`db:5432`).
- `frontend/.env` — `VITE_API_URL` (base URL dell'API Strapi, default `http://localhost:1338`).

### CORS

Le origini ammesse sono in `backend/config/middlewares.ts`. Aggiungi lì il dominio di produzione del
frontend quando vai online.

## Build di produzione

```bash
# Frontend → statico in frontend/dist (servibile da nginx/CDN)
cd frontend && npm run build

# Backend → build admin + start
cd backend && npm run build && npm run start
```

Per il deploy reale puoi riusare lo scaffold `strapi-gcp-scaffold` (Terraform + GitHub Actions su GCP):
stessa forma (frontend statico + Strapi + Cloud SQL), bastano i Dockerfile di produzione e le variabili.

## Personalizzare

- **Colori/icone delle categorie**: dall'admin, ogni categoria ha `color`, `accent` e `icon`
  (nome di un'icona [lucide](https://lucide.dev), es. `coffee`, `terminal`, `compass`, `book-open`).
- **Palette e font del sito**: `frontend/src/index.css` (`@theme`).
- **Profilo/bio/social**: single type _Profile_ nell'admin.
