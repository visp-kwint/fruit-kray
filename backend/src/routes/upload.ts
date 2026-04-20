import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Папка для загрузок
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения: jpg, jpeg, png, webp, gif'));
    }
  },
});

// POST /api/upload
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'Файл не загружен' });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  }
);

export default router;