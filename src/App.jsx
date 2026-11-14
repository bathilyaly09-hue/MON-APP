import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './styles.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const starterProjects = [
  { id: 'proj-1', name: 'Immeuble administratif - Lot B', address: '12 rue des Ateliers', status: 'En cours', updatedAt: 'Aujourd’hui' },
  { id: 'proj-2', name: 'Rénovation bureaux - Étage 2', address: '8 avenue du Parc', status: 'Planifié', updatedAt: 'Hier' },
  { id: 'proj-3', name: 'Atelier municipal', address: 'Zone artisanale, bâtiment C', status: 'À valider', updatedAt: '12 juin' },
];
const palette = [
  { type: 'prise', label: 'Prise', icon: '⌑', color: '#48d6aa' },
  { type: 'luminaire', label: 'Luminaire', icon: '✳', color: '#ffcb69' },
  { type: 'boite', label: 'Boîte', icon: '□', color: '#77aaff' },
  { type: 'tableau', label: 'Tableau', icon: '▤', color: '#ff8298' },
];
const checklistItems = [
  'Le trajet est défini sur le plan de chantier',
  'Les points de fixation sont repérés',
  'La compatibilité des composants est vérifiée',
  'Les consignes de sécurité du chantier sont consultées',
];

function readProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem('electriplan-projects'));
    return Array.isArray(saved) && saved.length ? saved : starterProjects;
  } catch {
    return starterProjects;
  }
}

function App() {
  const [projects, setProjects] = useState(readProjects);
  const [projectId, setProjectId] = useState(() => readProjects()[0]?.id);
  const [activePage, setActivePage] = useState('Tableau de bord');
  const [markers, setMarkers] = useState([]);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Installation salle technique', status: 'En cours', progress: 72 },
    { id: 2, title: 'Réseau lumineux RDC', status: 'À vérifier', progress: 46 },
    { id: 3, title: 'Prises bureau étage 2', status: 'Planifié', progress: 21 },
  ]);
  const [checked, setChecked] = useState([]);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState('');
  const [notice, setNotice] = useState('');
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [apiStatus, setApiStatus] = useState('Vérification du serveur…');
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedProject = projects.find((project) => project.id === projectId) ?? projects[0];

  useEffect(() => {
    localStorage.setItem('electriplan-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(() => setApiStatus('API connectée'))
      .catch(() => setApiStatus('Mode local — API non démarrée'));
  }, []);

  useEffect(() => () => {
    if (plan?.url) URL.revokeObjectURL(plan.url);
  }, [plan]);

  function createProject(event) {
    event.preventDefault();
    if (!projectName.trim()) return;
    const project = {
      id: `proj-${Date.now()}`,
      name: projectName.trim(),
      address: projectAddress.trim() || 'Adresse à compléter',
      status: 'Planifié',
      updatedAt: 'À l’instant',
    };
    setProjects((current) => [project, ...current]);
    setProjectId(project.id);
    setProjectName('');
    setProjectAddress('');
    setNewProjectOpen(false);
    setMarkers([]);
    setNotice('Projet créé. Les modifications sont enregistrées dans ce navigateur.');
  }

  async function importPlan(file) {
    setPlanError('');
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['image/png', 'image/jpeg'].includes(file.type) || ['png', 'jpg', 'jpeg'].includes(extension);
    const isPdf = file.type === 'application/pdf' || extension === 'pdf';
    if (!isImage && !isPdf) {
      setPlanError('Format non pris en charge. Choisissez un fichier PDF, PNG ou JPG.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setPlanError('Le fichier dépasse la limite de 20 Mo.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPlan((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return { file, url, kind: isPdf ? 'pdf' : 'image' };
    });
    setMarkers([]);
    setActivePage('Plan & composants');
  }

  function placeMarker(type, event) {
    event.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const position = point.matrixTransform(svg.getScreenCTM().inverse());
    const item = palette.find((entry) => entry.type === type);
    setMarkers((current) => [...current, {
      id: `marker-${Date.now()}-${Math.random()}`,
      type,
      label: item.label,
      color: item.color,
      x: Math.max(2, Math.min(98, (position.x / 1000) * 100)),
      y: Math.max(2, Math.min(98, (position.y / 650) * 100)),
    }]);
  }

  function moveMarker(id, event) {
    event.preventDefault();
    const marker = markers.find((entry) => entry.id === id);
    if (!marker) return;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const position = point.matrixTransform(svg.getScreenCTM().inverse());
    setMarkers((current) => current.map((entry) => entry.id === id ? {
      ...entry,
      x: Math.max(2, Math.min(98, (position.x / 1000) * 100)),
      y: Math.max(2, Math.min(98, (position.y / 650) * 100)),
    } : entry));
  }

  function updateTask(id, changes) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...changes } : task));
  }

  const navItems = ['Tableau de bord', 'Projets', 'Plan & composants', 'Tâches', 'Checklist', 'Rapports'];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#accueil" onClick={(event) => { event.preventDefault(); setActivePage('Tableau de bord'); }}>
          <span className="logo">EP</span>
          <span><small>ESPACE CHANTIER</small><strong>ÉlectriPlan-Pro</strong></span>
        </a>
        <div className="workspace-label">ESPACE DE TRAVAIL</div>
        <nav className="nav" aria-label="Navigation principale">
          {navItems.map((item, index) => <button key={item} className={`nav-item ${activePage === item ? 'active' : ''}`} onClick={() => setActivePage(item)}><span className="nav-icon">{['⌂', '▦', '⌖', '☷', '✓', '↗'][index]}</span>{item}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="project-mini"><span className="status-dot" /> Chantier actif<strong>{selectedProject?.name ?? 'Aucun projet'}</strong></div>
          <div className="api-state"><span className="status-dot muted" />{apiStatus}</div>
          <small className="safety-note">Outil d’aide à la planification. Faites valider les choix par un professionnel qualifié selon les règles locales.</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><span className="logo">EP</span><strong>ÉlectriPlan-Pro</strong></div>
          <div className="breadcrumb"><span>Chantiers</span><span>/</span><strong>{selectedProject?.name ?? 'Nouveau projet'}</strong></div>
          <div className="top-actions"><button className="button button-soft" onClick={() => fileInputRef.current?.click()}>↑ <span>Importer un plan</span></button><input ref={fileInputRef} className="visually-hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event) => { importPlan(event.target.files?.[0]); event.target.value = ''; }} /><button className="avatar" aria-label="Profil">É</button></div>
        </header>

        {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fermer">×</button></div>}
        {planError && <div className="alert" role="alert">{planError}</div>}

        {activePage === 'Tableau de bord' && <>
          <section className="welcome-row"><div><p className="eyebrow">VOTRE CHANTIER EN UN COUP D’ŒIL</p><h1>Bonjour, équipe chantier <span>👋</span></h1><p className="muted-text">Suivez l’avancement et préparez les prochaines interventions.</p></div><button className="button button-primary" onClick={() => { setNewProjectOpen(true); setActivePage('Projets'); }}>＋ Nouveau projet</button></section>
          <section className="metrics-grid">
            <Metric icon="▦" label="Projets actifs" value={projects.length} tone="blue" note="Dans votre espace" />
            <Metric icon="⌖" label="Points placés" value={markers.length} tone="green" note="Sur le plan affiché" />
            <Metric icon="↗" label="Tâches ouvertes" value={tasks.filter((task) => task.progress < 100).length} tone="orange" note="À suivre sur chantier" />
            <Metric icon="✓" label="Checklist" value={`${checked.length}/${checklistItems.length}`} tone="purple" note="Éléments vérifiés" />
          </section>
          <section className="dashboard-grid">
            <article className="panel project-panel"><div className="panel-heading"><div><p className="eyebrow">SUIVI DU CHANTIER</p><h2>{selectedProject?.name ?? 'Aucun projet'}</h2><p className="muted-text">{selectedProject?.address}</p></div><button className="button button-soft" onClick={() => setActivePage('Projets')}>Gérer les projets</button></div><div className="plan-preview"><PlanDisplay plan={plan} markers={markers.slice(0, 7)} svgRef={null} onDrop={() => {}} onDragOver={() => {}} onMarkerMove={() => {}} /><div className="preview-overlay"><span className="pill"><span className="status-dot" />{plan ? plan.file.name : 'Aucun plan importé'}</span><button className="button button-white" onClick={() => plan ? setActivePage('Plan & composants') : fileInputRef.current?.click()}>{plan ? 'Ouvrir le plan' : 'Importer un plan'}</button></div></div></article>
            <article className="panel task-panel"><div className="panel-heading"><div><p className="eyebrow">À FAIRE</p><h2>Travaux en cours</h2></div><button className="text-button" onClick={() => setActivePage('Tâches')}>Tout voir →</button></div><TaskList tasks={tasks.slice(0, 3)} updateTask={updateTask} compact /></article>
          </section>
          <section className="panel checklist-panel"><div className="panel-heading"><div><p className="eyebrow">AVANT INTERVENTION</p><h2>Checklist de préparation</h2></div><button className="text-button" onClick={() => setActivePage('Checklist')}>Ouvrir la checklist →</button></div><div className="checklist-preview">{checklistItems.slice(0, 3).map((item, index) => <CheckItem key={item} item={item} checked={checked.includes(index)} onChange={() => setChecked((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])} />)}</div></section>
        </>}

        {activePage === 'Projets' && <section className="page-content"><div className="page-title"><div><p className="eyebrow">GESTION DE CHANTIER</p><h1>Mes projets</h1><p className="muted-text">Organisez les bâtiments, plans et interventions de vos chantiers.</p></div><button className="button button-primary" onClick={() => setNewProjectOpen(true)}>＋ Nouveau projet</button></div><div className="project-grid">{projects.map((project) => <article className={`panel project-card ${projectId === project.id ? 'selected' : ''}`} key={project.id}><div className="project-card-top"><span className="project-icon">▦</span><span className={`project-status ${project.status === 'En cours' ? 'in-progress' : ''}`}>{project.status}</span></div><h2>{project.name}</h2><p className="muted-text">⌖ {project.address}</p><div className="project-card-footer"><span>Mis à jour {project.updatedAt}</span><button className="button button-soft" onClick={() => { setProjectId(project.id); setMarkers([]); setActivePage('Plan & composants'); }}>Ouvrir le chantier →</button></div></article>)}</div></section>}

        {activePage === 'Plan & composants' && <section className="page-content"><div className="page-title"><div><p className="eyebrow">OUTIL DE PLANIFICATION</p><h1>Plan & composants</h1><p className="muted-text">Importez un plan puis glissez les repères sur leur position.</p></div><button className="button button-primary" onClick={() => fileInputRef.current?.click()}>↑ Importer un plan</button></div><div className="editor-layout"><aside className="panel tools-panel"><h2>Composants</h2><p className="muted-text">Glissez un composant sur le plan.</p><div className="palette">{palette.map((item) => <div key={item.type} className="palette-item" draggable onDragStart={(event) => event.dataTransfer.setData('component-type', item.type)} onClick={() => setNotice(`Glissez « ${item.label} » sur le plan pour le placer.`)}><span className="component-icon" style={{ color: item.color }}>{item.icon}</span><span>{item.label}</span><span className="drag-handle">⠿</span></div>)}</div><div className="tool-divider"/><h3>Éléments placés <span className="count-badge">{markers.length}</span></h3>{markers.length ? <ul className="marker-list">{markers.map((marker) => <li key={marker.id}><span className="status-dot" style={{ background: marker.color }} />{marker.label}<button onClick={() => setMarkers((current) => current.filter((entry) => entry.id !== marker.id))} aria-label={`Supprimer ${marker.label}`}>×</button></li>)}</ul> : <p className="empty-hint">Aucun composant placé pour le moment.</p>}<button className="button button-soft full-width" onClick={() => setMarkers([])} disabled={!markers.length}>Effacer les repères</button></aside><div className="panel canvas-panel"><div className="canvas-heading"><div><h2>{plan?.file.name ?? 'Zone de plan'}</h2><p className="muted-text">{plan ? 'Déposez des composants sur le plan.' : 'Importez un PDF, une image PNG ou JPG pour commencer.'}</p></div>{plan && <button className="icon-button" onClick={() => { setPlan(null); setMarkers([]); }} aria-label="Retirer le plan">×</button>}</div>{plan ? <PlanDisplay plan={plan} markers={markers} svgRef={svgRef} onDrop={placeMarker} onDragOver={(event) => event.preventDefault()} onMarkerMove={moveMarker} onMarkerRemove={(id) => setMarkers((current) => current.filter((marker) => marker.id !== id))} /> : <button className="upload-zone" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); importPlan(event.dataTransfer.files?.[0]); }}><span className="upload-icon">↑</span><strong>Glissez votre plan ici</strong><span>ou cliquez pour sélectionner un fichier</span><small>PDF, PNG ou JPG · 20 Mo maximum</small></button>}<p className="disclaimer">Les repères sont des annotations de travail et ne constituent pas une validation électrique ou réglementaire.</p></div></div></section>}

        {activePage === 'Tâches' && <section className="page-content"><div className="page-title"><div><p className="eyebrow">ORGANISATION D’ÉQUIPE</p><h1>Tâches du chantier</h1><p className="muted-text">Suivez les interventions et leur avancement.</p></div><button className="button button-primary" onClick={() => setTasks((current) => [...current, { id: Date.now(), title: 'Nouvelle intervention', status: 'Planifié', progress: 0 }])}>＋ Ajouter une tâche</button></div><article className="panel task-page"><TaskList tasks={tasks} updateTask={updateTask} /></article></section>}

        {activePage === 'Checklist' && <section className="page-content"><div className="page-title"><div><p className="eyebrow">PRÉPARATION ET CONTRÔLE</p><h1>Checklist de chantier</h1><p className="muted-text">Cochez les vérifications réalisées avant intervention.</p></div><span className="completion-badge">{checked.length} / {checklistItems.length} vérifiés</span></div><article className="panel checklist-page">{checklistItems.map((item, index) => <CheckItem key={item} item={item} checked={checked.includes(index)} onChange={() => setChecked((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])} />)}<div className="safety-callout"><strong>Rappel sécurité</strong><p>Cette checklist est un support de préparation, pas un certificat de conformité. Faites confirmer les décisions par une personne qualifiée et appliquez la réglementation locale ainsi que les procédures du chantier.</p></div></article></section>}

        {activePage === 'Rapports' && <section className="page-content"><div className="page-title"><div><p className="eyebrow">DOCUMENTATION</p><h1>Rapports</h1><p className="muted-text">Synthèse de l’état actuel de votre chantier.</p></div><button className="button button-primary" onClick={() => window.print()}>Imprimer / enregistrer PDF</button></div><article className="panel report-card"><h2>{selectedProject?.name}</h2><p>{selectedProject?.address}</p><div className="report-stats"><span><strong>{markers.length}</strong> composants placés</span><span><strong>{tasks.length}</strong> tâches suivies</span><span><strong>{checked.length}/{checklistItems.length}</strong> vérifications cochées</span></div><h3>Travaux suivis</h3><TaskList tasks={tasks} updateTask={updateTask} compact /></article></section>}
      </main>

      {newProjectOpen && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setNewProjectOpen(false); }}><form className="modal panel" onSubmit={createProject}><div className="panel-heading"><div><p className="eyebrow">NOUVEAU CHANTIER</p><h2>Créer un projet</h2></div><button type="button" className="icon-button" onClick={() => setNewProjectOpen(false)} aria-label="Fermer">×</button></div><label>Nom du projet<input autoFocus required value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Ex. Rénovation du bâtiment A" /></label><label>Adresse du chantier<input value={projectAddress} onChange={(event) => setProjectAddress(event.target.value)} placeholder="Adresse ou zone du chantier" /></label><div className="modal-actions"><button type="button" className="button button-soft" onClick={() => setNewProjectOpen(false)}>Annuler</button><button type="submit" className="button button-primary">Créer le projet</button></div></form></div>}
    </div>
  );
}

function Metric({ icon, label, value, tone, note }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}>{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function TaskList({ tasks, updateTask, compact = false }) {
  return <div className={`task-list ${compact ? 'compact' : ''}`}>{tasks.map((task) => <div className="task-row" key={task.id}><div className="task-info"><span className="task-check">✓</span><div><strong>{task.title}</strong><small>{task.status}</small></div></div><div className="task-progress"><div className="progress-track"><span style={{ width: `${task.progress}%` }} /></div><div className="task-progress-meta"><span>{task.progress}%</span><select aria-label={`Statut de ${task.title}`} value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value })}><option>Planifié</option><option>En cours</option><option>À vérifier</option><option>Terminé</option></select></div></div></div>)}</div>;
}

function CheckItem({ item, checked, onChange }) {
  return <label className={`check-row ${checked ? 'is-checked' : ''}`}><input type="checkbox" checked={checked} onChange={onChange} /><span className="custom-check">✓</span><span>{item}</span></label>;
}

function PlanDisplay({ plan, markers, svgRef, onDrop, onDragOver, onMarkerMove, onMarkerRemove = () => {} }) {
  const [pdfPage, setPdfPage] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!plan || plan.kind !== 'pdf') {
      setPdfPage(null);
      setPdfError('');
      return undefined;
    }
    let pdfDocument;
    setPdfError('');
    pdfjs.getDocument(plan.url).promise.then(async (document) => {
      pdfDocument = document;
      const page = await document.getPage(1);
      const viewport = page.getViewport({ scale: 1.35 });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      if (!cancelled) setPdfPage({ width: viewport.width, height: viewport.height, pages: document.numPages });
    }).catch(() => { if (!cancelled) setPdfError('Impossible de lire ce PDF. Vérifiez le fichier et réessayez.'); });
    return () => { cancelled = true; pdfDocument?.destroy(); };
  }, [plan]);

  return <div className={`plan-stage ${plan ? 'has-plan' : ''}`} onDragOver={onDragOver} onDrop={(event) => { if (event.dataTransfer.files?.length) return; const type = event.dataTransfer.getData('component-type'); if (type) onDrop(type, event); }}>
    {plan?.kind === 'image' && <img className="plan-image" src={plan.url} alt={`Plan importé : ${plan.file.name}`} />}
    {plan?.kind === 'pdf' && <><canvas ref={canvasRef} className="pdf-canvas" />{!pdfPage && !pdfError && <p className="pdf-loading">Chargement du PDF…</p>}{pdfError && <p className="pdf-error">{pdfError}</p>}{pdfPage?.pages > 1 && <span className="pdf-page-label">Page 1 / {pdfPage.pages}</span>}</>}
    {!plan && <svg viewBox="0 0 1000 650" className="sample-plan" aria-label="Plan schématique de démonstration"><rect x="35" y="35" width="930" height="580" rx="8" fill="#fbfcfe" stroke="#9eacc0" strokeWidth="5" /><g fill="#f2f6fa" stroke="#9eacc0" strokeWidth="4"><rect x="90" y="100" width="300" height="190"/><rect x="390" y="100" width="240" height="190"/><rect x="630" y="100" width="270" height="190"/><rect x="90" y="350" width="360" height="210"/><rect x="450" y="350" width="450" height="210"/></g><g stroke="#bfccda" strokeWidth="3"><path d="M90 320H900M410 100V560M660 100V290M250 350V560"/></g><g fill="#64748b" fontSize="22" fontFamily="sans-serif"><text x="160" y="205">SALLE TECHNIQUE</text><text x="435" y="205">BUREAU</text><text x="715" y="205">HALL</text><text x="175" y="460">ATELIER</text><text x="570" y="460">ZONE DE TRAVAIL</text></g></svg>}
    <svg ref={svgRef} className="annotation-layer" viewBox="0 0 1000 650" onDragOver={onDragOver} onDrop={(event) => { if (onDrop) { const type = event.dataTransfer.getData('component-type'); if (type) onDrop(type, event); } }} aria-label="Calque de repères du plan">{markers.map((marker) => <g key={marker.id} transform={`translate(${marker.x * 10}, ${marker.y * 6.5})`} className="placed-marker" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (event.buttons === 1) onMarkerMove?.(marker.id, event); }}><circle r="20" fill={marker.color} opacity="0.2"/><circle r="10" fill={marker.color} stroke="white" strokeWidth="3"/><text y="35" textAnchor="middle">{marker.label}</text><foreignObject x="11" y="-30" width="28" height="28"><button xmlns="http://www.w3.org/1999/xhtml" className="marker-delete" aria-label={`Supprimer ${marker.label}`} onClick={() => onMarkerRemove(marker.id)}>×</button></foreignObject></g>)}</svg>
  </div>;
}

export default App;
