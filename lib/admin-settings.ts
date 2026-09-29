export type SaveableSettingState<T> = {
  saved: T;
  draft: T;
  status: "clean" | "dirty" | "saving" | "saved" | "error";
  error: string | null;
};

export type SaveableSettingEvent<T> =
  | { type: "change"; value: T }
  | { type: "revert-field"; field: keyof T }
  | { type: "save-start" }
  | { type: "save-success" }
  | { type: "save-error"; message: string };

function sameValue<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function createSaveableSettingState<T>(value: T): SaveableSettingState<T> {
  return { saved: value, draft: value, status: "clean", error: null };
}

export function isSaveableSettingDirty<T>(state: SaveableSettingState<T>): boolean {
  return !sameValue(state.saved, state.draft);
}

export function reduceSaveableSettingState<T>(
  state: SaveableSettingState<T>,
  event: SaveableSettingEvent<T>,
): SaveableSettingState<T> {
  switch (event.type) {
    case "change":
      if (state.status === "saving") return state;
      return { ...state, draft: event.value, status: sameValue(event.value, state.saved) ? "clean" : "dirty", error: null };
    case "revert-field": {
      if (state.status === "saving") return state;
      // 只把一个素材槽恢复为已保存值，其余草稿保留
      const draft = { ...state.draft, [event.field]: state.saved[event.field] } as T;
      return { ...state, draft, status: sameValue(draft, state.saved) ? "clean" : "dirty", error: null };
    }
    case "save-start":
      return { ...state, status: "saving", error: null };
    case "save-success":
      return { saved: state.draft, draft: state.draft, status: "saved", error: null };
    case "save-error":
      return { ...state, status: "error", error: event.message };
  }
}
