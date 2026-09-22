type AdminHistory = {
  state: unknown;
  replaceState: (data: unknown, unused: string, url?: string | URL | null) => void;
  pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
  back: () => void;
  forward: () => void;
};

type PopstateTarget = {
  addEventListener: (type: "popstate", listener: () => void) => void;
  removeEventListener: (type: "popstate", listener: () => void) => void;
};

export type UnsavedAdminHistoryGuard = {
  allowNextPop: () => void;
  remove: () => void;
};

let nextHistoryGuardId = 1;

export function installUnsavedAdminHistoryGuard({
  history,
  target,
  href,
  currentHref,
  confirmLeave,
}: {
  history: AdminHistory;
  target: PopstateTarget;
  href: string;
  currentHref: () => string;
  confirmLeave: () => boolean;
}): UnsavedAdminHistoryGuard {
  const originalState = history.state;
  const state = originalState && typeof originalState === "object" ? originalState : {};
  const guardId = nextHistoryGuardId++;
  const baseState = { ...state, __adminHistoryGuardId: guardId, __adminHistoryGuardPosition: "base" };
  const topState = { ...state, __adminHistoryGuardId: guardId, __adminHistoryGuardPosition: "top" };
  let allowNextPop = false;

  history.replaceState(baseState, "", href);
  history.pushState(topState, "", href);

  const handlePopstate = () => {
    const current = history.state as Record<string, unknown> | null;
    if (current?.__adminHistoryGuardId !== guardId || current.__adminHistoryGuardPosition !== "base") return;

    if (allowNextPop || confirmLeave()) {
      allowNextPop = false;
      history.back();
    } else {
      history.forward();
    }
  };

  target.addEventListener("popstate", handlePopstate);

  return {
    allowNextPop() {
      allowNextPop = true;
    },
    remove() {
      target.removeEventListener("popstate", handlePopstate);
      const current = history.state as Record<string, unknown> | null;
      if (
        current?.__adminHistoryGuardId !== guardId ||
        current.__adminHistoryGuardPosition !== "top" ||
        currentHref() !== href
      ) return;

      const restoreOriginalEntry = () => {
        target.removeEventListener("popstate", restoreOriginalEntry);
        history.replaceState(originalState, "", href);
      };
      target.addEventListener("popstate", restoreOriginalEntry);
      history.back();
    },
  };
}
