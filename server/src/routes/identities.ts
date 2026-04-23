import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import seed from '../data/identities.json' with { type: 'json' };


export const router = Router();
const store: any[] = [...seed];

// Deliberate failure mode: ~0.12 of requests return 500 on a randomly-selected mutating endpoint.
const FAIL_RATE = Number(process.env.FAIL_RATE ?? '0.12');
function maybeFail(res: any) {
  if (Math.random() < FAIL_RATE) {
    res.status(500).type('application/problem+json').json({
      type: 'https://errors.meridianfs.example/upstream-failure',
      title: 'Upstream transient failure',
      status: 500,
      detail: 'Simulated failure for demo traffic.',
    });
    return true;
  }
  return false;
}

router.get('/identities', (_req, res) => {
  res.json({ data: store.slice(0, 25), has_more: store.length > 25, next_cursor: null });
});

router.post('/identities', async (req, res) => {
  if (maybeFail(res)) return;

  const obj = {
    id: 'idt_' + uuidv4().replace(/-/g,'').slice(0, 22).toUpperCase(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'pending',
    ...req.body,
  };
  store.unshift(obj);
  res.status(201).json(obj);
});

router.get('/identities/:id', (req, res) => {
  const obj = store.find(x => x.id === req.params.id);
  if (!obj) return res.status(404).type('application/problem+json').json({
    type:'https://errors.meridianfs.example/not-found', title:'Not found', status:404
  });
  res.json(obj);
});

// Remaining mutating endpoints share the maybeFail gate
router.post('/identities/:id/*', (req, res) => {
  if (maybeFail(res)) return;
  const obj = store.find(x => x.id === req.params.id);
  if (!obj) return res.status(404).type('application/problem+json').json({ type:'https://errors.meridianfs.example/not-found', title:'Not found', status:404 });
  obj.status = 'completed'; obj.updated_at = new Date().toISOString();
  res.status(200).json(obj);
});
