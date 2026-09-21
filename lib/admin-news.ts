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

export function serializeAdminPost(post: PrismaAdminPost): PostItem {
  return { ...post, createdAt: post.createdAt.toISOString() };
}

export function getPostKind(post: Pick<PostItem, "title">): PostKind {
  return post.title === null ? "short" : "article";
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
