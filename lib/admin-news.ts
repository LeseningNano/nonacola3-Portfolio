import type { PostItem } from "@/lib/types";

export type PostKind = "short" | "article";
export type NewsFilter = "all" | "published" | "draft";

type PrismaAdminPost = Omit<PostItem, "createdAt"> & {
  createdAt: Date;
};

export type NewsListState = {
  posts: PostItem[];
  snapshot: PostItem[] | null;
  pendingId: string | null;
};

export type NewsListEvent =
  | { type: "toggle-start"; id: string }
  | { type: "remove-start"; id: string }
  | { type: "mutation-success" }
  | { type: "mutation-error" };

export type PostEditorFields = {
  title: string;
  body: string;
  tag: string;
  intendedPublished: boolean;
};

export type PostEditorState = PostEditorFields & {
  kind: PostKind;
  baseline: PostEditorFields;
  status: "clean" | "dirty" | "saving" | "saved" | "error";
  error: string | null;
};

export type PostEditorEvent =
  | { type: "field"; field: "title" | "body" | "tag"; value: string }
  | { type: "save-start"; published: boolean }
  | { type: "save-success" }
  | { type: "save-error"; message: string };

export type PostEditorValidation =
  | { ok: true }
  | { ok: false; field: "title" | "body"; message: string };

export function serializeAdminPost(post: PrismaAdminPost): PostItem {
  return { ...post, createdAt: post.createdAt.toISOString() };
}

export function getPostKind(post: Pick<PostItem, "title">): PostKind {
  return post.title === null ? "short" : "article";
}

export function createPostEditorState(kind: PostKind, post?: PostItem): PostEditorState {
  const fields: PostEditorFields = {
    title: post?.title ?? "",
    body: post?.body ?? "",
    tag: post?.tag ?? "",
    intendedPublished: post?.published ?? false,
  };

  return {
    kind,
    ...fields,
    baseline: { ...fields },
    status: "clean",
    error: null,
  };
}

export function validatePostEditor(state: PostEditorState): PostEditorValidation {
  if (state.kind === "article" && !state.title.trim()) {
    return { ok: false, field: "title", message: "标题不能为空" };
  }
  if (!state.body.trim()) {
    return { ok: false, field: "body", message: "正文不能为空" };
  }
  return { ok: true };
}

export function confirmPostEditorNavigation(
  isDirty: boolean,
  confirmLeave: () => boolean,
) {
  return !isDirty || confirmLeave();
}

export function createPostPayload(
  state: PostEditorState,
  published: boolean,
): { title: string | null; body: string; tag: string | null; published: boolean } {
  return {
    title: state.kind === "short" ? null : state.title.trim(),
    body: state.body.trim(),
    tag: state.tag.trim() || null,
    published,
  };
}

export function reducePostEditorState(
  state: PostEditorState,
  event: PostEditorEvent,
): PostEditorState {
  if (event.type === "field") {
    return { ...state, [event.field]: event.value, status: "dirty", error: null };
  }

  if (event.type === "save-start") {
    return { ...state, intendedPublished: event.published, status: "saving", error: null };
  }

  if (event.type === "save-error") {
    return { ...state, status: "error", error: event.message };
  }

  const baseline: PostEditorFields = {
    title: state.title,
    body: state.body,
    tag: state.tag,
    intendedPublished: state.intendedPublished,
  };
  return { ...state, baseline, status: "saved", error: null };
}

export function normalizeAdminPostTitle(title: string | null | undefined): string | null {
  return title == null ? null : title.trim();
}

export function filterAdminPosts(
  posts: PostItem[],
  filter: NewsFilter,
  query: string,
): PostItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return posts.filter((post) => {
    if (filter === "published" && post.published !== true) return false;
    if (filter === "draft" && post.published !== false) return false;
    if (!normalizedQuery) return true;

    return [post.title ?? "", post.body].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery),
    );
  });
}

export function reduceNewsListState(
  state: NewsListState,
  event: NewsListEvent,
): NewsListState {
  if (event.type === "mutation-success") {
    return { ...state, snapshot: null, pendingId: null };
  }

  if (event.type === "mutation-error") {
    return state.snapshot
      ? { posts: state.snapshot, snapshot: null, pendingId: null }
      : { ...state, pendingId: null };
  }

  if (state.pendingId !== null) return state;

  if (event.type === "toggle-start") {
    const target = state.posts.find((post) => post.id === event.id);
    if (!target) return state;
    return {
      posts: state.posts.map((post) =>
        post.id === event.id ? { ...post, published: !post.published } : post,
      ),
      snapshot: state.posts,
      pendingId: event.id,
    };
  }

  if (!state.posts.some((post) => post.id === event.id)) return state;
  return {
    posts: state.posts.filter((post) => post.id !== event.id),
    snapshot: state.posts,
    pendingId: event.id,
  };
}
