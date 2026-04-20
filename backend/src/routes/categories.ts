import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

function slugify(input: string) {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ь: '', ы: 'y', ъ: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return input
    .toLowerCase()
    .trim()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

router.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  res.json(categories);
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const Schema = z.object({
    name: z.string().min(2, 'Название слишком короткое'),
  });

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const name = parsed.data.name.trim();
  const slug = slugify(name);

  const exists = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug }],
    },
  });

  if (exists) {
    res.status(409).json({ error: 'Такая категория уже существует' });
    return;
  }

  const category = await prisma.category.create({
    data: { name, slug },
  });

  res.status(201).json(category);
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Категория удалена' });
  } catch {
    res.status(400).json({ error: 'Нельзя удалить категорию, если к ней привязаны товары' });
  }
});

export default router;