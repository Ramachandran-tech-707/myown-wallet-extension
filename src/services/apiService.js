/**
 * apiService.js
 * All communication with the My Own Wallet backend API.
 * Works in both web (localStorage) and Chrome extension (chrome.storage.local).
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Storage adapter (same pattern as utils/storage.js) ───────────────
const isExtension =
    typeof chrome !== "undefined" &&
    typeof chrome.storage !== "undefined" &&
    typeof chrome.runtime !== "undefined" &&
    !!chrome.runtime.id;

const kv = {
    get: async (key) => {
        if (isExtension) {
            return new Promise((res) =>
                chrome.storage.local.get([key], (r) => res(r[key] ?? null))
            );
        }
        return localStorage.getItem(key);
    },
    set: async (key, val) => {
        if (isExtension) {
            return new Promise((res) => chrome.storage.local.set({ [key]: val }, res));
        }
        localStorage.setItem(key, val);
    },
    remove: async (key) => {
        if (isExtension) {
            return new Promise((res) => chrome.storage.local.remove([key], res));
        }
        localStorage.removeItem(key);
    },
};

// ── Device ID ─────────────────────────────────────────────────────────
const getDeviceId = async () => {
    let id = await kv.get("myownwallet_device_id");
    if (!id) {
        id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        await kv.set("myownwallet_device_id", id);
    }
    return id;
};

// ── Token Management ──────────────────────────────────────────────────
const getToken = async () => kv.get("myownwallet_jwt");
const saveToken = async (t) => kv.set("myownwallet_jwt", t);
export const clearToken = async () => kv.remove("myownwallet_jwt");

// ── Base Fetch with timeout ───────────────────────────────────────────
const request = async (method, path, body = null, timeoutMs = 8000) => {
    const token = await getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `API error ${res.status}`);
        return data;
    } finally {
        clearTimeout(tid);
    }
};

// ── Auth ──────────────────────────────────────────────────────────────
export const registerDevice = async (primaryAddress = null) => {
    try {
        const deviceId = await getDeviceId();
        const body = { deviceId };
        if (primaryAddress) body.primaryAddress = primaryAddress;
        const data = await request("POST", "/auth/register", body);
        if (data.token) await saveToken(data.token);
        return { success: true, ...data };
    } catch (err) {
        // Non-fatal — wallet works fully offline without backend
        console.warn("[API] registerDevice failed (backend offline?):", err.message);
        return { success: false, error: err.message };
    }
};

export const getMe = async () => {
    try {
        return await request("GET", "/auth/me");
    } catch (err) {
        console.warn("[API] getMe failed:", err.message);
        return null;
    }
};

// ── Wallet Backup ─────────────────────────────────────────────────────
export const fetchBackup = async () => {
    const token = await getToken();
    if (!token) return null;
    try {
        const data = await request("GET", "/wallet/backup");
        return data.success ? data.data : null;
    } catch (err) {
        console.warn("[API] fetchBackup failed:", err.message);
        return null;
    }
};

export const syncWallets = async (wallets, accountNames = {}) => {
    const token = await getToken();
    if (!token) return false;
    try {
        await request("POST", "/wallet/sync", { wallets, accountNames });
        return true;
    } catch (err) {
        console.warn("[API] syncWallets failed:", err.message);
        return false;
    }
};

export const syncSettings = async (settings) => {
    const token = await getToken();
    if (!token) return false;
    try {
        await request("PATCH", "/wallet/settings", settings);
        return true;
    } catch (err) {
        console.warn("[API] syncSettings failed:", err.message);
        return false;
    }
};

export const deleteWalletBackup = async (address) => {
    const token = await getToken();
    if (!token) return false;
    try {
        await request("DELETE", `/wallet/${address}`);
        return true;
    } catch (err) {
        console.warn("[API] deleteWalletBackup failed:", err.message);
        return false;
    }
};

// ── Activity ──────────────────────────────────────────────────────────
export const logActivity = async (activity) => {
    const token = await getToken();
    if (!token) return false;
    try {
        await request("POST", "/activity", activity);
        return true;
    } catch (err) {
        console.warn("[API] logActivity failed:", err.message);
        return false;
    }
};

export const getActivities = async (limit = 50, skip = 0) => {
    const token = await getToken();
    if (!token) return [];
    try {
        const data = await request("GET", `/activity?limit=${limit}&skip=${skip}`);
        return data.data || [];
    } catch (err) {
        console.warn("[API] getActivities failed:", err.message);
        return [];
    }
};

export const updateActivityStatus = async (txHash, status) => {
    try {
        await request("PATCH", `/activity/${txHash}/status`, { status });
        return true;
    } catch (err) {
        console.warn("[API] updateActivityStatus failed:", err.message);
        return false;
    }
};

export const clearActivities = async () => {
    try {
        await request("DELETE", "/activity");
        return true;
    } catch (err) {
        return false;
    }
};

export { getDeviceId };