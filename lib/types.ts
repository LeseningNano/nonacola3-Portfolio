// 真理来源：所有视频/文章类型定义集中于此，避免各文件重复且字段不一致。

export interface Video {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  date: string | null; // 已序列化为 ISO 字符串（Prisma DateTime → ISO）
  createdAt: string;
  updatedAt: string;
}

export interface VideoRow {
  // 用于 marquee/grid 等不展示 createdAt/updatedAt 的场景
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  date: string | null;
}

export interface PostItem {
  id: string;
  title: string | null;
  body: string;
  tag: string | null;
  createdAt: string; // ISO
}