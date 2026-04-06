const KEY = "nhm_saved_routes";

export function getSavedRoutes() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveRoute(name, routeData) {
  const routes = getSavedRoutes();
  const entry = {
    id: String(Date.now()),
    name: name.trim() || "My Route",
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    routeData,
  };
  localStorage.setItem(KEY, JSON.stringify([entry, ...routes]));
  return entry;
}

export function deleteRoute(id) {
  const routes = getSavedRoutes().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(routes));
}
