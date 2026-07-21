"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastKind = "error" | "info" | "success";
interface Toast { id: number; kind: ToastKind; message: string }
interface Ctx { toast: (msg: string, kind?: ToastKind) => void; error: (msg: string) => void; success: (msg: string) => void }

const ToastCtx = createContext<Ctx>({ toast: () => {}, error: () => {}, success: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timeouts.current.get(id);
    if (t) { clearTimeout(t); timeouts.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    const t = setTimeout(() => remove(id), 3500);
    timeouts.current.set(id, t);
  }, [remove]);

  const error = useCallback((m: string) => toast(m, "error"), [toast]);
  const success = useCallback((m: string) => toast(m, "success"), [toast]);

  useEffect(() => () => { timeouts.current.forEach((t) => clearTimeout(t)); }, []);

  return (
    <ToastCtx.Provider value={{ toast, error, success }}>
      {children}
      <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 text-sm border min-w-[240px] max-w-[400px] animate-slide-in-right ${
              t.kind === "error"
                ? "border-red-800 bg-red-950/80 text-red-200"
                : t.kind === "success"
                ? "border-neutral-600 bg-neutral-900/90 text-neutral-200"
                : "border-neutral-700 bg-neutral-900/90 text-neutral-200"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}