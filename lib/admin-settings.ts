export type SaveableSettingState<T> = {
  saved: T;
  draft: T;
  status: "clean" | "dirty" | "saving" | "saved" | "error";
  error: string | null;
};

export type SaveableSettingEvent<T> =
  | { type: "change"; value: T }
  | { type: "save-start" }
  | { type: "save-success" }
  | { type: "save-error"; message: string };

export function createSaveableSettingState<T>(value: T): SaveableSettingState<T> {
  return { saved: value, draft: value, status: "clean", error: null };
}

export function reduceSaveableSettingState<T>(
  state: SaveableSettingState<T>,
  event: SaveableSettingEvent<T>,
): SaveableSettingState<T> {
  switch (event.type) {
    case "change":
      if (state.status === "saving") return state;
      return { ...state, draft: event.value, status: "dirty", error: null };
    case "save-start":
      return { ...state, status: "saving", error: null };
    case "save-success":
      return { saved: state.draft, draft: state.draft, status: "saved", error: null };
    case "save-error":
      return { ...state, status: "error", error: event.message };
  }
}
