// 从详情页回到首页 / Works 页时的落点：
// 1. 有离开时记下的滚动位置 → 回到原位置（「返回」链接与浏览器后退都适用）；
// 2. 没有记录（如直接打开分享链接）→ 回到所属板块（首页的 works / news）；
// 3. 都没有 → 页面顶部。
// 位置由 ScrollMemory 在滚动时写入 sessionStorage；这里只做决策，便于测试。

export type ReturnPage = "home" | "works";
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const RESTORE_KEY = "scroll-restore";
// 与 navbar / home-client 现有的「跳到首页某板块」共用同一个键
export const PENDING_SECTION_KEY = "pending-scroll";
export const BACK_FLAG = "back";
// 恢复标记形如 "home:<时间戳>" / "back:<时间戳>"，只在短时间内有效：
// 落地页若不是首页 / Works（如后退到另一篇文章），标记不应拖到之后的普通访问
export const RESTORE_FLAG_TTL_MS = 10_000;

export const scrollPosKey = (page: ReturnPage) => `scroll-pos:${page}`;

export function markBack(storage: StorageLike, now = Date.now()) {
  storage.setItem(RESTORE_KEY, `${BACK_FLAG}:${now}`);
}

export function planReturn(
  storage: StorageLike,
  page: ReturnPage,
  section?: string,
  now = Date.now()
): "restore" | "section" | "top" {
  if (storage.getItem(scrollPosKey(page)) !== null) {
    storage.setItem(RESTORE_KEY, `${page}:${now}`);
    return "restore";
  }
  if (section) {
    storage.setItem(PENDING_SECTION_KEY, section);
    return "section";
  }
  return "top";
}

// 页面挂载时调用：这次进入是否要恢复位置。只读不删——开发模式下组件会挂载两次，
// 第二次仍要拿到；恢复完成或用户开始滚动后由 finishRestore 清掉。
export function takeRestore(storage: StorageLike, page: ReturnPage, now = Date.now()): number | null {
  const flag = storage.getItem(RESTORE_KEY);
  if (flag === null) return null;
  const separator = flag.lastIndexOf(":");
  const target = separator === -1 ? flag : flag.slice(0, separator);
  const at = separator === -1 ? NaN : Number(flag.slice(separator + 1));
  if (!Number.isFinite(at) || now - at > RESTORE_FLAG_TTL_MS) {
    storage.removeItem(RESTORE_KEY);
    return null;
  }
  if (target !== page && target !== BACK_FLAG) return null;
  const saved = Number(storage.getItem(scrollPosKey(page)));
  return Number.isFinite(saved) && saved > 0 ? saved : null;
}

export function finishRestore(storage: StorageLike) {
  storage.removeItem(RESTORE_KEY);
}
