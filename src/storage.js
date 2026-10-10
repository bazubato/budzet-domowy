// Zamiennik window.storage (dostępnego w artefaktach Claude.ai) oparty o localStorage
// przeglądarki. Zachowuje ten sam kształt odpowiedzi, więc App.jsx nie wymaga zmian.
//
// UWAGA: dane trzymane są lokalnie w tej przeglądarce/na tym urządzeniu.
// Nie synchronizują się między urządzeniami ani przeglądarkami.

const PREFIX = "budzet-domowy:";

function pelnyKlucz(key, shared) {
  return PREFIX + (shared ? "shared:" : "") + key;
}

const storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(pelnyKlucz(key, shared));
    if (raw === null) {
      throw new Error(`Klucz nie istnieje: ${key}`);
    }
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    localStorage.setItem(pelnyKlucz(key, shared), value);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const pelny = pelnyKlucz(key, shared);
    const istnial = localStorage.getItem(pelny) !== null;
    localStorage.removeItem(pelny);
    return { key, deleted: istnial, shared };
  },

  async list(prefix = "", shared = false) {
    const szukanyPrefiks = pelnyKlucz(prefix, shared);
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(szukanyPrefiks)) {
        keys.push(k.slice(pelnyKlucz("", shared).length));
      }
    }
    return { keys, prefix, shared };
  },
};

export default storage;
