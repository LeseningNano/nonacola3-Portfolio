import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  POSTGRES_URL_NON_POOLING: z.string().min(1).optional(),
  DATABASE_URL_UNPOOLED: z.string().min(1).optional(),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
});

// parse 不抛错，允许缺值（开发期可能未配 BLOB）；取用时各自判空。
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // 启动期给清晰提示，不阻断构建（缺失非致命变量时）
  console.warn("[env] 校验警告:", parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : {};
export const ADMIN_USERNAME = env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = env.ADMIN_PASSWORD;