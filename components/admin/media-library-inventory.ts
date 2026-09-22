export type InventoryRequest = {
  generation: number;
  controller: AbortController;
};

export function createMediaInventoryRequestController(
  setLoading: (loading: boolean) => void,
) {
  let generation = 0;
  let activeRequest: InventoryRequest | null = null;

  function isCurrent(request: InventoryRequest) {
    return activeRequest === request && generation === request.generation;
  }

  return {
    start(): InventoryRequest {
      activeRequest?.controller.abort();
      const request = { generation: generation + 1, controller: new AbortController() };
      generation = request.generation;
      activeRequest = request;
      setLoading(true);
      return request;
    },
    invalidate() {
      generation += 1;
      activeRequest?.controller.abort();
      activeRequest = null;
      setLoading(false);
    },
    isCurrent,
    finish(request: InventoryRequest) {
      if (!isCurrent(request)) return false;
      activeRequest = null;
      setLoading(false);
      return true;
    },
  };
}
