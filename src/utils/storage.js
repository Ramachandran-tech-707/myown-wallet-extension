const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.runtime &&
    chrome.runtime.id;

const storage = import.meta.env.DEV && !isExtension
    ? {
        get: async (key) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch { return null; }
        },
        set: async (key, value) => {
            try { localStorage.setItem(key, JSON.stringify(value)); }
            catch (e) { console.error("Storage set error:", e); }
        },
        remove: async (key) => {
            localStorage.removeItem(key);
        },
        clearAll: async () => {
            const keys = ["wallets", "selectedAccount", "selectedNetwork", "accountNames", "activities"];
            keys.forEach((k) => localStorage.removeItem(k));
        },
    }
    : {
        get: async (key) =>
            new Promise((resolve) =>
                chrome.storage.local.get([key], (res) => resolve(res[key] ?? null))
            ),
        set: async (key, value) =>
            new Promise((resolve) =>
                chrome.storage.local.set({ [key]: value }, resolve)
            ),
        remove: async (key) =>
            new Promise((resolve) =>
                chrome.storage.local.remove([key], resolve)
            ),
        clearAll: async () =>
            new Promise((resolve) =>
                chrome.storage.local.clear(resolve)
            ),
    };

export default storage;