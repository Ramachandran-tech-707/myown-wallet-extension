/**
 * apiService.js
 * All communication with the My Own Wallet backend API.
 * Uses localStorage to persist the JWT token and deviceId.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Device ID ─────────────────────────────────────────
// Stable per-browser identifier — generated once and stored locally.
const getDeviceId = () => {
    let id = localStorage.getItem("myownwallet_device_id");
    if (!id) {
        id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("myownwallet_device_id", id);
    }
    return id;
};

// ── Token Management ──────────────────────────────────
const getToken = () => localStorage.getItem("myownwallet_jwt");
const saveToken = (t) => localStorage.setItem("myownwallet_jwt", t);
const clearToken = () => localStorage.removeItem("myownwallet_jwt");

// ── Base Fetch Helper ─────────────────────────────────
const request = async (method, path, body = null) => {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || `API error ${res.status}`);
    }
    return data;
};

// ── Auth ──────────────────────────────────────────────

/**
 * Register/authenticate this device.
 * Call once on app boot — safe to call on every session.
 */
export const registerDevice = async (primaryAddress = null) => {
    try {
        const body = { deviceId: getDeviceId() };
        if (primaryAddress) body.primaryAddress = primaryAddress;
        const data = await request("POST", "/auth/register", body);
        if (data.token) saveToken(data.token);
        return { success: true, ...data };
    } catch (err) {
        console.warn("[API] registerDevice failed:", err.message);
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

// ── Wallet Backup ─────────────────────────────────────

/**
 * Pull full backup from MongoDB.
 * Returns { wallets, accountNames, settings } or null on failure.
 */
export const fetchBackup = async () => {
    if (!getToken()) return null;
    try {
        const data = await request("GET", "/wallet/backup");
        return data.success ? data.data : null;
    } catch (err) {
        console.warn("[API] fetchBackup failed:", err.message);
        return null;
    }
};

/**
 * Push local wallets + account names to MongoDB.
 * Fire-and-forget style — local storage is still the primary.
 */
export const syncWallets = async (wallets, accountNames = {}) => {
    if (!getToken()) return false; // no JWT yet — skip silently
    try {
        await request("POST", "/wallet/sync", { wallets, accountNames });
        return true;
    } catch (err) {
        console.warn("[API] syncWallets failed:", err.message);
        return false;
    }
};

/**
 * Update settings in MongoDB.
 */
export const syncSettings = async (settings) => {
    if (!getToken()) return false; // no JWT yet — skip silently
    try {
        await request("PATCH", "/wallet/settings", settings);
        return true;
    } catch (err) {
        console.warn("[API] syncSettings failed:", err.message);
        return false;
    }
};

/**
 * Remove a single wallet from the MongoDB backup.
 */
export const deleteWalletBackup = async (address) => {
    if (!getToken()) return false;
    try {
        await request("DELETE", `/wallet/${address}`);
        return true;
    } catch (err) {
        console.warn("[API] deleteWalletBackup failed:", err.message);
        return false;
    }
};

// ── Activity ──────────────────────────────────────────

/**
 * Log a transaction/activity to MongoDB.
 */
export const logActivity = async (activity) => {
    if (!getToken()) return false;
    try {
        await request("POST", "/activity", activity);
        return true;
    } catch (err) {
        console.warn("[API] logActivity failed:", err.message);
        return false;
    }
};

/**
 * Get paginated activity history from MongoDB.
 */
export const getActivities = async (limit = 50, skip = 0) => {
    if (!getToken()) return [];
    try {
        const data = await request("GET", `/activity?limit=${limit}&skip=${skip}`);
        return data.data || [];
    } catch (err) {
        console.warn("[API] getActivities failed:", err.message);
        return [];
    }
};

/**
 * Update a transaction's status in MongoDB.
 */
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

export { getDeviceId, clearToken };