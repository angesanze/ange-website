/**
 * One-shot seed: opens public read permissions and, if the DB is empty,
 * fills it with warm sample content (categories, posts, thoughts, profile).
 *
 * Re-running is safe: permissions are reconciled every boot, content is only
 * created when there are no categories yet.
 */

type Strapi = any;

/** Accent-aware kebab-case slug (uid fields are required and not auto-filled via the Documents API). */
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------------ */
/* Permissions                                                         */
/* ------------------------------------------------------------------ */

async function setPublicPermissions(strapi: Strapi, map: Record<string, string[]>) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) return;

  for (const [api, actions] of Object.entries(map)) {
    for (const action of actions) {
      const fullAction = `${api}.${action}`;
      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action: fullAction, role: publicRole.id } });

      if (!existing) {
        await strapi
          .query('plugin::users-permissions.permission')
          .create({ data: { action: fullAction, role: publicRole.id } });
      }
    }
  }
  strapi.log.info('[seed] public read permissions reconciled');
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function createPublished(strapi: Strapi, uid: string, data: Record<string, any>) {
  const doc = await strapi.documents(uid).create({ data });
  await strapi.documents(uid).publish({ documentId: doc.documentId });
  return doc;
}

/* ------------------------------------------------------------------ */
/* Sample content                                                      */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  {
    name: 'Tech',
    description: 'Sistemi, codice, decisioni di architettura e qualche cicatrice di produzione.',
    color: '#49412f',
    accent: '#8a7142',
    icon: 'terminal',
    order: 1,
  },
  {
    name: 'Coffee',
    description: 'La mia ossessione lenta: estrazioni, rituali e tazzine.',
    color: '#bd7f3c',
    accent: '#ddb061',
    icon: 'coffee',
    order: 2,
  },
  {
    name: 'Leadership',
    description: 'Costruire team, fiducia e prodotti — visti dalla sedia del CTO.',
    color: '#a8552f',
    accent: '#cd7d4c',
    icon: 'compass',
    order: 3,
  },
  {
    name: 'Appunti',
    description: 'Pensieri lunghi, note a margine, letture che restano.',
    color: '#7e7b4a',
    accent: '#a8a06a',
    icon: 'book-open',
    order: 4,
  },
];

const POSTS = [
  // ---- Tech ----
  {
    category: 'Tech',
    title: 'La cache è una bugia che ci raccontiamo',
    excerpt:
      'Una cache è una promessa di coerenza che decidiamo di non mantenere. Funziona finché non ci credi troppo.',
    readingTime: 4,
    featured: true,
    tags: ['caching', 'sistemi'],
    content: `Ogni cache è un piccolo patto col diavolo: barattiamo la verità per la velocità. Il problema non è la cache in sé, è il momento in cui smettiamo di ricordarci che stiamo guardando una fotografia, non il presente.

La maggior parte dei bug "impossibili" che ho incontrato in produzione erano cache che mentivano con grande sicurezza. Un valore stantio non urla: sussurra, e lo fa in modo plausibile.

La regola che mi sono dato è semplice: una cache deve avere una data di scadenza **e** un modo ovvio per essere bypassata. Se non riesci a spegnerla in dieci secondi, non è una cache, è un secondo database che non hai dichiarato.`,
  },
  {
    category: 'Tech',
    title: 'Monoliti, microservizi e altre religioni',
    excerpt:
      'La domanda non è "monolite o microservizi?". È "quanta complessità organizzativa sei disposto a pagare per disaccoppiare?".',
    readingTime: 5,
    featured: false,
    tags: ['architettura', 'sistemi'],
    content: `Ho visto monoliti eleganti e ho visto microservizi che erano un monolite distribuito col latenza in più. L'architettura non si sceglie su uno schema bianco: si eredita, si negozia, si paga.

I microservizi risolvono un problema **organizzativo** prima che tecnico. Se i tuoi team non hanno confini chiari, spezzare il codice non ti darà confini: ti darà solo più rete tra le tue confusioni.

Parti dal monolite modulare. Disaccoppia quando il dolore è reale e misurabile, non quando è di moda. La complessità è un prestito: contraila solo se sai come ripagarlo.`,
  },
  {
    category: 'Tech',
    title: 'La code review come atto di cura',
    excerpt:
      'Una review non è un controllo qualità. È il momento in cui dico a un collega: ho letto il tuo lavoro, mi importa.',
    readingTime: 3,
    featured: false,
    tags: ['team', 'codice'],
    content: `La peggior code review che puoi fare è quella che cerca solo errori. La migliore è quella che cerca di capire perché qualcuno ha fatto una certa scelta.

Approvo volentieri codice imperfetto se la direzione è giusta e il rischio è contenuto. Blocco senza esitazione codice "perfetto" che nessuno capirà fra tre mesi.

Una review è anche un dono di tempo. Quando commento, provo a lasciare la persona un po' più capace di prima, non un po' più piccola.`,
  },
  {
    category: 'Tech',
    title: 'Perché tengo i miei appunti in Markdown',
    excerpt: 'Testo semplice, niente lock-in, sopravvive a qualsiasi app. I miei pensieri meritano un formato che dura.',
    readingTime: 2,
    featured: false,
    tags: ['tooling', 'scrittura'],
    content: `Ho cambiato decine di app per le note. L'unica costante, in quindici anni, è stata una cartella di file \`.md\`.

Il Markdown non è elegante: è **durevole**. Si apre ovunque, si versiona con git, si cerca con grep, e non sparirà quando una startup verrà acquisita.

Le idee importanti meritano un formato che non chiede il permesso a nessuno per essere lette.`,
  },
  // ---- Coffee ----
  {
    category: 'Coffee',
    title: '18 mesi per un espresso decente a casa',
    excerpt:
      'Spoiler: il problema non era mai la macchina. Era la macinatura, la grammatura e la mia pazienza.',
    readingTime: 5,
    featured: true,
    tags: ['espresso', 'rituale'],
    content: `Ho comprato la macchina pensando fosse lei a fare il caffè. Diciotto mesi dopo ho capito che la macchina è l'ultimo anello, non il primo.

Il vero salto è arrivato col macinino. Macinatura fresca, pesata sul grammo, tempo di estrazione cronometrato. Ho iniziato a trattare l'espresso come un piccolo esperimento riproducibile: una variabile alla volta.

La parte più difficile non è tecnica, è caratteriale: accettare di buttare il primo caffè della mattina quando è sbagliato, invece di berlo per pigrizia. Il gusto è un dato. La pazienza è il metodo.`,
  },
  {
    category: 'Coffee',
    title: 'La mia ricetta per la V60',
    excerpt: 'Rapporto 1:16, acqua a 92°, tre versate. Il resto è ascolto.',
    readingTime: 3,
    featured: false,
    tags: ['v60', 'filtro', 'ricetta'],
    content: `Quindici grammi di caffè, duecentoquaranta di acqua. Macinatura media, tipo sale grosso. Acqua intorno ai 92 gradi.

Bloom di quaranta secondi con il doppio del peso del caffè in acqua. Poi due versate lente, circolari, senza fretta. Tempo totale: due minuti e mezzo, tre.

La V60 non perdona la fretta, ma non chiede attrezzatura costosa. Chiede solo che tu sia lì, presente, per tre minuti. È la cosa più simile a una meditazione che faccia al mattino.`,
  },
  {
    category: 'Coffee',
    title: 'Il caffè come rituale di concentrazione',
    excerpt: 'Non è la caffeina. È il gesto ripetuto che dice al cervello: ora si lavora.',
    readingTime: 2,
    featured: false,
    tags: ['rituale', 'focus'],
    content: `Macinare, pesare, versare. Tre gesti che faccio prima di ogni blocco di lavoro profondo. La caffeina aiuta, certo, ma il vero effetto è un altro.

È un rituale di transizione: un confine netto tra il rumore e il silenzio, tra le notifiche e il pensiero. Cinque minuti di gesti lenti che dicono al cervello dove andare.

Ho smesso di cercare la produttività nelle app. L'ho trovata in una tazzina e in un piccolo cerimoniale.`,
  },
  // ---- Leadership ----
  {
    category: 'Leadership',
    title: 'Cosa significa davvero essere CTO',
    excerpt:
      'Meno codice di quanto pensassi, più conversazioni di quanto volessi. Il lavoro è rendere gli altri capaci di decidere senza di me.',
    readingTime: 6,
    featured: true,
    tags: ['cto', 'ruolo'],
    content: `Quando sono diventato CTO pensavo che il lavoro fosse prendere le decisioni tecniche difficili. Mi sbagliavo. Il lavoro è costruire un contesto in cui le decisioni giuste diventino ovvie per chi le deve prendere.

Scrivo molto meno codice. Scrivo molti più documenti, faccio molte più domande, e passo gran parte del tempo a togliere ostacoli che non hanno nulla di tecnico.

Il metro di successo è cambiato. Non è più "ho risolto il problema". È "il team ha risolto il problema, e non si è accorto che io ero in ferie". Se sono il collo di bottiglia, ho fallito, per quanto brillante fosse la mia soluzione.`,
  },
  {
    category: 'Leadership',
    title: 'Assumere per fiducia, non per CV',
    excerpt: 'I CV raccontano il passato. Io cerco persone di cui mi fiderei alle due di notte durante un incidente.',
    readingTime: 4,
    featured: false,
    tags: ['hiring', 'team'],
    content: `Il curriculum migliore che abbia mai letto apparteneva a una persona che si è rivelata un disastro per il team. Da allora ho smesso di assumere lo storico e ho iniziato ad assumere il comportamento.

Cerco tre cose: come ragiona quando non sa la risposta, come parla degli errori che ha fatto, e come tratta le persone da cui non ha nulla da guadagnare.

La competenza si costruisce. La fiducia, l'onestà e la cura per i dettagli si scoprono — e sono molto più difficili da insegnare.`,
  },
  // ---- Appunti ----
  {
    category: 'Appunti',
    title: 'Note sparse su sistemi e lentezza',
    excerpt: 'Frammenti che non meritano un post intero ma che non voglio perdere.',
    readingTime: 3,
    featured: false,
    tags: ['note', 'lentezza'],
    content: `La velocità di un sistema non è la velocità del suo componente più rapido, ma quella del suo collo di bottiglia più lento. Lo stesso vale per i team.

La lentezza, a volte, è un'informazione. Quando una cosa è difficile da fare in fretta, spesso è perché è difficile e basta — e la fretta sta solo nascondendo il problema sotto il tappeto.

Mi sto convincendo che "andare piano" non sia l'opposto di "andare veloce". Sia il modo in cui si va veloce a lungo.`,
  },
];

const THOUGHTS = [
  { body: "Il miglior codice che ho scritto quest'anno l'ho cancellato.", mood: 'calm' },
  { body: 'Un buon caffè e una buona stack trace fanno la stessa cosa: ti svegliano.', mood: 'spark' },
  { body: 'Scrivere è il modo più onesto che conosco per scoprire cosa penso davvero.', mood: 'warm' },
  { body: 'Le 23:00 sono l\'unico ambiente di staging che funziona sempre.', mood: 'night' },
  { body: 'Ogni astrazione è un prestito. Prima o poi paghi gli interessi.', mood: 'bitter' },
  { body: 'A volte la roadmap migliore è una tazzina e mezz\'ora di silenzio.', mood: 'sweet' },
  { body: 'La fiducia scala meglio di qualsiasi processo che abbia mai scritto.', mood: 'warm' },
  { body: 'Non automatizzo per fare prima. Automatizzo per smettere di pensarci.', mood: 'calm' },
];

const PROFILE = {
  name: 'Ange',
  role: 'CTO',
  tagline: 'Costruisco sistemi e ci penso su.',
  location: 'Italia',
  bio: `Sono un CTO. Passo le giornate tra architetture, persone e decisioni che invecchieranno meglio o peggio di quanto spero.

Questo è il mio angolo di internet: niente algoritmo, niente metriche di vanità. Solo cose tecniche, un'ossessione per il caffè e qualche pensiero sparso che avevo bisogno di scrivere per capirlo.`,
  socials: [
    { label: 'GitHub', url: 'https://github.com/', icon: 'github' },
    { label: 'LinkedIn', url: 'https://linkedin.com/', icon: 'linkedin' },
  ],
};

/* The site-wide settings (single type). English chrome by default — every field
   is editable from the admin, so copy/fonts/icons can be tuned without code. */
const GLOBAL = {
  siteName: 'ange',
  tagline: 'Technical notes, a coffee obsession and scattered thoughts.',
  brandIcon: '',
  homeTitle: 'Technical notes and scattered thoughts.',
  homeSubtitle: '',
  homeCaption: 'block size = amount of content · click to enter',
  filesTitle: 'All files',
  filesDescription: 'Every piece of writing, ordered like a filesystem.',
  filesIcon: 'folder-open',
  thoughtsTitle: 'Scattered thoughts',
  thoughtsSubtitle:
    'Short, off-the-cuff fragments. Flip through them like a deck of postcards — no folders, no order, just the flow.',
  thoughtsIcon: 'message-circle-heart',
  thoughtsDefaultView: 'carousel',
  aboutTitle: 'About',
  aboutIcon: 'user-round',
  navFiles: 'Files',
  navThoughts: 'Thoughts',
  navAbout: 'About',
  footerText: 'made with coffee and curiosity',
  headingFont: '',
  bodyFont: '',
  monoFont: '',
  customFonts: [],
};

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export async function seed(strapi: Strapi) {
  await setPublicPermissions(strapi, {
    'api::category.category': ['find', 'findOne'],
    'api::post.post': ['find', 'findOne'],
    'api::thought.thought': ['find', 'findOne'],
    'api::profile.profile': ['find'],
    'api::global.global': ['find'],
  });

  // Global settings (single type): ensure it exists with sensible defaults, even
  // on a database that already has content from an earlier seed.
  const globalCount = await strapi.db.query('api::global.global').count();
  if (globalCount === 0) {
    await strapi.documents('api::global.global').create({ data: GLOBAL });
    strapi.log.info('[seed] global settings created');
  }

  const existing = await strapi.db.query('api::category.category').count();
  if (existing > 0) {
    strapi.log.info('[seed] content already present — skipping content seed');
    return;
  }

  strapi.log.info('[seed] empty database — seeding warm sample content…');

  // Categories (no draft/publish)
  const categoryIdByName: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const doc = await strapi.documents('api::category.category').create({
      data: { ...cat, slug: slugify(cat.name) },
    });
    categoryIdByName[cat.name] = doc.documentId;
  }

  // Posts (published)
  for (const post of POSTS) {
    const { category, ...rest } = post;
    await createPublished(strapi, 'api::post.post', {
      ...rest,
      slug: slugify(rest.title),
      category: categoryIdByName[category],
    });
  }

  // Thoughts (published)
  for (const thought of THOUGHTS) {
    await createPublished(strapi, 'api::thought.thought', thought);
  }

  // Profile (single type)
  await strapi.documents('api::profile.profile').create({ data: PROFILE });

  strapi.log.info(
    `[seed] done — ${CATEGORIES.length} categories, ${POSTS.length} posts, ${THOUGHTS.length} thoughts, 1 profile`
  );
}
