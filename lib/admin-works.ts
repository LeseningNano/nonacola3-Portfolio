import type { Video } from "@/lib/types";

export type AdminWork = Video;

export type WorkFormState = {
  title: string;
  description: string;
  summary: string;
  role: string;
  tools: string;
  category: string;
  embedUrl: string;
  thumbnail: string;
  featured: boolean;
  order: number;
  date: string;
};

export type WorkPayload = {
  title: string;
  description: string | null;
  summary: string | null;
  role: string | null;
  tools: string | null;
  category: string;
  embedUrl: string;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  date: string | null;
};

export type WorkEditorStatus = "clean" | "dirty" | "saving" | "saved" | "error";

export type WorkEditorState = {
  form: WorkFormState;
  baseline: WorkFormState;
  status: WorkEditorStatus;
  error: string | null;
};

export type ReorderItem = {
  id: string;
  order: number;
  featured: boolean;
};

export type WorkOrderStatus = "clean" | "dirty" | "saving" | "saved" | "error";

export type WorkOrderState = {
  initial: ReorderItem[];
  items: ReorderItem[];
  status: WorkOrderStatus;
  error: string | null;
};

export type WorkOrderEvent =
  | { type: "move"; from: number; to: number }
  | { type: "featured"; index: number; featured: boolean }
  | { type: "cancel" }
  | { type: "save-start" }
  | { type: "save-success"; items: ReorderItem[] }
  | { type: "save-error"; message: string };

type WorkFieldEvent = {
  [Field in keyof WorkFormState]: {
    type: "field";
    field: Field;
    value: WorkFormState[Field];
  };
}[keyof WorkFormState];

export type WorkEditorEvent =
  | WorkFieldEvent
  | { type: "save-start" }
  | { type: "save-success"; form: WorkFormState }
  | { type: "save-error"; message: string };

type PrismaAdminWork = Omit<Video, "date" | "createdAt" | "updatedAt"> & {
  date: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export function serializeAdminWork(work: PrismaAdminWork): Video {
  return {
    ...work,
    date: work.date?.toISOString() ?? null,
    createdAt: work.createdAt?.toISOString() ?? "",
    updatedAt: work.updatedAt?.toISOString() ?? "",
  };
}

export function filterAdminWorks(
  works: Video[],
  query: string,
  featuredOnly: boolean,
): Video[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return works.filter((work) => {
    if (featuredOnly && !work.featured) return false;
    if (!normalizedQuery) return true;

    return [work.title, work.category].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery),
    );
  });
}

export function moveWork(
  items: ReorderItem[],
  from: number,
  to: number,
): ReorderItem[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return items;
  }

  const moved = [...items];
  const [item] = moved.splice(from, 1);
  moved.splice(to, 0, item);
  return moved.map((current, order) => ({ ...current, order }));
}

export function validateReorderItems(
  items: ReorderItem[],
): { ok: true } | { ok: false; error: string } {
  const ids = new Set(items.map(({ id }) => id));
  if (ids.size !== items.length) {
    return { ok: false, error: "作品 ID 不能重复" };
  }

  const orders = items.map(({ order }) => order);
  if (new Set(orders).size !== items.length) {
    return { ok: false, error: "排序值不能重复" };
  }

  const sortedOrders = [...orders].sort((left, right) => left - right);
  if (sortedOrders.some((order, index) => order !== index)) {
    return { ok: false, error: "排序值必须从 0 开始连续排列" };
  }

  return { ok: true };
}

function reorderItemsMatch(left: ReorderItem[], right: ReorderItem[]): boolean {
  return left.length === right.length && left.every((item, index) => {
    const other = right[index];
    return item.id === other.id && item.order === other.order && item.featured === other.featured;
  });
}

export function reduceOrderState(
  state: WorkOrderState,
  event: WorkOrderEvent,
): WorkOrderState {
  if (event.type === "move") {
    if (state.status === "saving") return state;
    const items = moveWork(state.items, event.from, event.to);
    return {
      ...state,
      items,
      status: reorderItemsMatch(items, state.initial) ? "clean" : "dirty",
      error: null,
    };
  }

  if (event.type === "featured") {
    if (state.status === "saving" || !state.items[event.index]) return state;
    const items = state.items.map((item, index) =>
      index === event.index ? { ...item, featured: event.featured } : item,
    );
    return {
      ...state,
      items,
      status: reorderItemsMatch(items, state.initial) ? "clean" : "dirty",
      error: null,
    };
  }

  if (event.type === "cancel") {
    return {
      initial: state.initial,
      items: state.initial.map((item) => ({ ...item })),
      status: "clean",
      error: null,
    };
  }

  if (event.type === "save-start") {
    return { ...state, status: "saving", error: null };
  }

  if (event.type === "save-success") {
    const committed = event.items.map((item) => ({ ...item }));
    return {
      initial: committed,
      items: committed.map((item) => ({ ...item })),
      status: "saved",
      error: null,
    };
  }

  return { ...state, status: "error", error: event.message };
}

export function createWorkFormState(work?: Video): WorkFormState {
  return {
    title: work?.title ?? "",
    description: work?.description ?? "",
    summary: work?.summary ?? "",
    role: work?.role ?? "",
    tools: work?.tools ?? "",
    category: work?.category ?? "",
    embedUrl: work?.embedUrl ?? "",
    thumbnail: work?.thumbnail ?? "",
    featured: work?.featured ?? false,
    order: work?.order ?? 0,
    date: work?.date?.slice(0, 10) ?? "",
  };
}

function nullableString(value: string): string | null {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

export function createWorkPayload(state: WorkFormState): WorkPayload {
  return {
    title: state.title.trim(),
    description: nullableString(state.description),
    summary: nullableString(state.summary),
    role: nullableString(state.role),
    tools: nullableString(state.tools),
    category: state.category.trim(),
    embedUrl: state.embedUrl.trim(),
    thumbnail: nullableString(state.thumbnail),
    featured: state.featured,
    order: Number.isFinite(state.order) ? Math.max(0, Math.trunc(state.order)) : 0,
    date: nullableString(state.date),
  };
}

function formsMatch(left: WorkFormState, right: WorkFormState): boolean {
  return (Object.keys(left) as (keyof WorkFormState)[]).every(
    (field) => left[field] === right[field],
  );
}

export function reduceWorkEditorState(
  state: WorkEditorState,
  event: WorkEditorEvent,
): WorkEditorState {
  if (event.type === "field") {
    if (state.status === "saving") return state;
    const form = { ...state.form, [event.field]: event.value } as WorkFormState;
    return {
      ...state,
      form,
      status: formsMatch(form, state.baseline) ? "clean" : "dirty",
      error: null,
    };
  }

  if (event.type === "save-start") {
    return { ...state, status: "saving", error: null };
  }

  if (event.type === "save-success") {
    return {
      form: event.form,
      baseline: event.form,
      status: "saved",
      error: null,
    };
  }

  return { ...state, status: "error", error: event.message };
}
