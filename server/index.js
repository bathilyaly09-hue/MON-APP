import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3001;
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Prototype-only in-memory store. Replace with a persistent database before production.
const projects = [];

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'electriplan-pro-api' });
});

app.get('/api/projects', (_request, response) => {
  response.json({ projects });
});

app.post('/api/projects', (request, response) => {
  const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
  if (!name) return response.status(400).json({ error: 'Le nom du projet est obligatoire.' });
  const project = {
    id: `project-${Date.now()}`,
    name: name.slice(0, 120),
    address: typeof request.body.address === 'string' ? request.body.address.trim().slice(0, 240) : '',
    status: 'Planifié',
    createdAt: new Date().toISOString(),
  };
  projects.push(project);
  return response.status(201).json({ project });
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Route API introuvable.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ÉlectriPlan-Pro API disponible sur http://localhost:${port}`);
});
