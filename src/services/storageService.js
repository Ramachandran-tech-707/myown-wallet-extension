/**
 * storageService.js
 * 
 * Dual-layer storage:
 *   PRIMARY   → localStorage (web) / chrome.storage.local (extension) — always used
 *   SECONDARY → MongoDB via apiService — background sync, never blocks the UI
 * 
 * All writes go to local first (instant), then sync to MongoDB async.
 * All reads come from local (fast), MongoDB is only used for backup restore.
 */

import storage from "../utils/storage";
import { syncWallets, syncSettings, deleteWalletBackup, logActivity, fetchBackup } from "./apiService";

// ── Internal: debounced background sync ──────────────
let syncTimer = null;
const scheduleSyncToMongo = (wallets, accountNames) => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncWallets(wallets, accountNames).catch(() => { });
    }, 2000); // wait 2s after last change before syncing
};

// ── Wallets ───────────────────────────────────────────
export const saveWallets = async (wallets) => {
    const arr = Array.isArray(wallets) ? wallets : [wallets];
    await storage.set("wallets", arr);
    // Background sync to MongoDB
    const names = await getAccountNames();
    scheduleSyncToMongo(arr, names);
};

export const getWallets = async () => {
    const wallets = await storage.get("wallets");
    if (!wallets) return [];
    return Array.isArray(wallets) ? wallets : [wallets];
};

export const addWallet = async (newWallet) => {
    const existing = await getWallets();
    const updated = [...existing, newWallet];
    await saveWallets(updated);
    return updated;
};

export const removeWallet = async (address) => {
    const existing = await getWallets();
    const updated = existing.filter((w) => w.address !== address);
    await saveWallets(updated);
    // Also remove from MongoDB backup
    deleteWalletBackup(address).catch(() => { });
    return updated;
};

// ── Selected Account ──────────────────────────────────
export const saveSelectedAccount = async (index) => {
    const idx = Number(index);
    await storage.set("selectedAccount", idx);
    // Sync setting to MongoDB (fire-and-forget)
    syncSettings({ selectedAccount: idx }).catch(() => { });
};

export const getSelectedAccount = async () => {
    const index = await storage.get("selectedAccount");
    return typeof index === "number" ? index : 0;
};

// ── Selected Network ──────────────────────────────────
export const saveSelectedNetwork = async (network) => {
    await storage.set("selectedNetwork", network);
    syncSettings({ selectedNetwork: network }).catch(() => { });
};

export const getSelectedNetwork = async () => {
    const network = await storage.get("selectedNetwork");
    return network || "ethereum";
};

// ── Account Names ─────────────────────────────────────
export const getAccountNames = async () => {
    const names = await storage.get("accountNames");
    return names || {};
};

export const saveAccountName = async (address, name) => {
    const names = await getAccountNames();
    names[address] = name;
    await storage.set("accountNames", names);
    // Sync updated names to MongoDB
    const wallets = await getWallets();
    scheduleSyncToMongo(wallets, names);
};

export const removeAccountName = async (address) => {
    const names = await getAccountNames();
    delete names[address];
    await storage.set("accountNames", names);
};

// ── Activity Log ──────────────────────────────────────
export const logWalletActivity = async (activity) => {
    // Store locally
    const existing = await storage.get("activities") || [];
    const updated = [{ ...activity, timestamp: new Date().toISOString() }, ...existing].slice(0, 100);
    await storage.set("activities", updated);
    // Sync to MongoDB
    logActivity(activity).catch(() => { });
};

export const getLocalActivities = async () => {
    return (await storage.get("activities")) || [];
};

// ── Restore from MongoDB backup ───────────────────────
/**
 * Called once on first app load if local storage is empty.
 * Pulls backup from MongoDB and restores it locally.
 */
export const restoreFromBackup = async () => {
    try {
        const backup = await fetchBackup();
        if (!backup || !backup.wallets?.length) return null;

        await storage.set("wallets", backup.wallets);
        if (backup.accountNames) await storage.set("accountNames", backup.accountNames);
        if (backup.settings?.selectedNetwork) await storage.set("selectedNetwork", backup.settings.selectedNetwork);
        if (typeof backup.settings?.selectedAccount === "number") await storage.set("selectedAccount", backup.settings.selectedAccount);

        console.log("[Storage] Restored", backup.wallets.length, "wallets from MongoDB backup");
        return backup;
    } catch (err) {
        console.warn("[Storage] Restore from backup failed:", err.message);
        return null;
    }
};

// ── Clear All ─────────────────────────────────────────
export const clearAll = async () => {
    if (typeof storage.clearAll === 'function') {
        await storage.clearAll();
    } else {
        await storage.remove("wallets");
        await storage.remove("selectedAccount");
        await storage.remove("selectedNetwork");
        await storage.remove("accountNames");
        await storage.remove("activities");
    }
};