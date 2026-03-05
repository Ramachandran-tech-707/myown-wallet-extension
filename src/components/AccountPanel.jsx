import { useState, useEffect } from "react";
import { TailSpin } from "react-loader-spinner";
import { toast } from "react-toastify";
import {
    getAccountNames, saveAccountName,
    addWallet, removeWallet, saveSelectedAccount,
} from "../services/storageService";
import { createNewWallet } from "../services/walletService";
import PasswordInput from "./PasswordInput";

const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const PlusIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ImportIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const DetailIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

function AccountPanel({ wallets, setWallets, currentWallet, setCurrentWallet, onClose, setStep }) {
    const [accountNames, setAccountNames] = useState({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [addPassword, setAddPassword] = useState("");
    const [addLoading, setAddLoading] = useState(false);

    useEffect(() => {
        getAccountNames().then(setAccountNames);
    }, []);

    const getDisplayName = (wallet, index) =>
        accountNames[wallet.address] || `Account ${index + 1}`;

    const handleSwitch = async (index) => {
        setCurrentWallet(wallets[index]);
        await saveSelectedAccount(index);
        toast.info(`Switched to ${getDisplayName(wallets[index], index)}`);
        onClose();
    };

    const handleAddAccount = async () => {
        if (!addPassword) return toast.error("Enter your wallet password");
        try {
            setAddLoading(true);
            toast.info("Creating account...");
            const newWallet = await createNewWallet(addPassword);
            const updated = await addWallet(newWallet);
            setWallets(updated);
            const newIndex = updated.length - 1;
            setCurrentWallet(updated[newIndex]);
            await saveSelectedAccount(newIndex);
            toast.success(`Account ${updated.length} created!`);
            setShowAddForm(false);
            setAddPassword("");
            onClose();
        } catch {
            toast.error("Wrong password or failed to create account");
        } finally {
            setAddLoading(false);
        }
    };

    const handleImport = () => { setStep("importAccount"); onClose(); };
    const handleDetails = () => { setStep("accountDetails"); onClose(); };

    return (
        <>
            <div className="panel-overlay" onClick={onClose} />
            <div className="account-panel">
                <div className="panel-header">
                    <h3>Accounts</h3>
                    <button className="icon-btn" onClick={onClose}><CloseIcon /></button>
                </div>

                <div className="panel-body">
                    {/* Account List */}
                    <div className="account-list">
                        {wallets.map((wallet, i) => {
                            const active = wallet.address === currentWallet?.address;
                            return (
                                <div
                                    key={wallet.address}
                                    className={`account-item${active ? " active" : ""}`}
                                    onClick={() => handleSwitch(i)}
                                >
                                    <div className="account-avatar" style={{ background: `hsl(${parseInt(wallet.address.slice(2, 4), 16) * 1.4}deg 60% 45%)` }}>
                                        {getDisplayName(wallet, i).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="account-item-info">
                                        <span className="account-item-name">{getDisplayName(wallet, i)}</span>
                                        <span className="account-item-addr">
                                            {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                                        </span>
                                    </div>
                                    {active && <span className="account-check"><CheckIcon /></span>}
                                </div>
                            );
                        })}
                    </div>

                    <div className="divider" style={{ margin: "0.5rem 0" }} />

                    {/* Actions */}
                    {!showAddForm ? (
                        <div className="panel-actions">
                            <button className="panel-action-btn" onClick={() => setShowAddForm(true)}>
                                <PlusIcon /> Add Account
                            </button>
                            <button className="panel-action-btn" onClick={handleImport}>
                                <ImportIcon /> Import Account
                            </button>
                            <button className="panel-action-btn" onClick={handleDetails}>
                                <DetailIcon /> Account Details
                            </button>
                        </div>
                    ) : (
                        <div className="panel-add-form">
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                                Enter your password to create a new account
                            </p>
                            <div className="form-group">
                                <label>Password</label>
                                <PasswordInput
                                    value={addPassword}
                                    onChange={(e) => setAddPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
                                    placeholder="Your wallet password"
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <button className="btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => { setShowAddForm(false); setAddPassword(""); }}>
                                    Cancel
                                </button>
                                <button className="btn-send btn-sm" style={{ width: "100%" }} onClick={handleAddAccount} disabled={addLoading}>
                                    {addLoading ? <TailSpin height={16} width={16} color="#fff" /> : "Create"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AccountPanel;