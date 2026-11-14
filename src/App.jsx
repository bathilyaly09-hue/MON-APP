const metrics = [
  { label: 'Projet actif', value: '3', accent: 'blue' },
  { label: 'Points d’installation', value: '48', accent: 'green' },
  { label: 'Câbles tracés', value: '126 m', accent: 'orange' },
  { label: 'Checklist validée', value: '86%', accent: 'purple' },
];

const jobs = [
  { title: 'Installation salle technique', status: 'En cours', progress: 72 },
  { title: 'Réseau lumineux RDC', status: 'À valider', progress: 46 },
  { title: 'Prises bureau étage 2', status: 'Planifié', progress: 21 },
];

const routes = [
  { name: 'Circuit A1', from: 'Tableau principal', to: 'Salle serveur', length: '24 m', status: 'OK' },
  { name: 'Circuit B3', from: 'Boîte de dérivation', to: 'Bureau 204', length: '18 m', status: 'À vérifier' },
  { name: 'Circuit C2', from: 'Poteau d’éclairage', to: 'Zone stockage', length: '32 m', status: 'OK' },
];

const checklist = [
  'Le trajet respecte la zone de passage définie',
  'Les points de fixation sont visibles sur le plan',
  'Le câble est compatible avec la charge estimée',
  'La distance de sécurité est respectée autour des appareils',
  'Le plan est conforme au schéma de chantier en cours',
];

const rooms = [
  { name: 'Salle serveur', x: 90, y: 120, w: 150, h: 100 },
  { name: 'Bureau 204', x: 290, y: 120, w: 150, h: 120 },
  { name: 'Hall', x: 500, y: 120, w: 140, h: 140 },
  { name: 'Stockage', x: 110, y: 320, w: 190, h: 120 },
  { name: 'Atelier', x: 390, y: 330, w: 220, h: 110 },
];

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">EP</div>
          <div>
            <p className="eyebrow">Projet</p>
            <h1>ÉlectriPlan-Pro</h1>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Accueil</button>
          <button className="nav-item">Plans</button>
          <button className="nav-item">Câblage</button>
          <button className="nav-item">Points</button>
          <button className="nav-item">Vérifications</button>
          <button className="nav-item">Rapports</button>
        </nav>

        <div className="sidebar-card">
          <p className="label">Statut du chantier</p>
          <strong>Installation principale</strong>
          <div className="progress-line">
            <span style={{ width: '74%' }} />
          </div>
          <small>74 % d’avancement</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Bâtiment</p>
            <h2>Immeuble administratif - Lot B</h2>
          </div>

          <div className="actions">
            <button className="secondary-btn">Importer plan</button>
            <button className="primary-btn">Nouvelle vérification</button>
          </div>
        </header>

        <section className="metrics-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className={`metric-card ${metric.accent}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel large-panel">
            <div className="panel-header">
              <h3>Plan du bâtiment</h3>
              <button className="ghost-btn">Vue détaillée</button>
            </div>

            <div className="blueprint-wrap">
              <div className="blueprint">
                <svg viewBox="0 0 740 520" aria-label="Plan de bâtiment">
                  <rect x="20" y="20" width="700" height="480" rx="18" fill="#0d172a" stroke="#3c5072" strokeWidth="2" />
                  <g fill="#152a42" stroke="#2c4370" strokeWidth="2">
                    {rooms.map((room) => (
                      <rect key={room.name} x={room.x} y={room.y} width={room.w} height={room.h} rx="10" />
                    ))}
                  </g>

                  <g stroke="#a0b9d8" strokeWidth="2" fill="none" opacity="0.9">
                    <path d="M40 250 H700" />
                    <path d="M310 40 V480" />
                    <path d="M110 250 V420" />
                    <path d="M520 260 V470" />
                  </g>

                  <g>
                    <circle cx="210" cy="150" r="7" fill="#56d6a4" />
                    <circle cx="340" cy="205" r="7" fill="#bbf0ff" />
                    <circle cx="560" cy="240" r="7" fill="#ffd166" />
                    <circle cx="500" cy="420" r="7" fill="#ff8fa3" />
                  </g>

                  <g stroke="#6ee7b7" strokeWidth="4" fill="none" strokeLinecap="round">
                    <path d="M210 150 L340 205 L560 240" />
                    <path d="M340 205 L500 420" />
                  </g>
                </svg>

                <div className="map-tag tag-green" style={{ left: '22%', top: '24%' }}>Salle serveur</div>
                <div className="map-tag tag-blue" style={{ left: '42%', top: '24%' }}>Bureau 204</div>
                <div className="map-tag tag-orange" style={{ left: '72%', top: '25%' }}>Hall</div>
                <div className="map-tag tag-pink" style={{ left: '27%', top: '62%' }}>Stockage</div>
              </div>
            </div>
          </div>

          <div className="panel sidebar-panel">
            <div className="panel-header">
              <h3>Trajets de câble</h3>
              <span className="chip success">3 actifs</span>
            </div>

            <div className="route-list">
              {routes.map((route) => (
                <div key={route.name} className="route-item">
                  <div className="route-head">
                    <strong>{route.name}</strong>
                    <span className={`status ${route.status === 'OK' ? 'ok' : 'warn'}`}>{route.status}</span>
                  </div>
                  <p>{route.from} → {route.to}</p>
                  <small>{route.length}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Checklist de sécurité</h3>
              <span className="chip">5 points</span>
            </div>

            <ul className="checklist">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Travaux en cours</h3>
              <span className="chip neutral">3 tâches</span>
            </div>

            <div className="jobs-list">
              {jobs.map((job) => (
                <div key={job.title} className="job-item">
                  <div className="job-header">
                    <strong>{job.title}</strong>
                    <span>{job.status}</span>
                  </div>
                  <div className="progress-line small-line">
                    <span style={{ width: `${job.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
