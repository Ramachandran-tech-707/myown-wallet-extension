import { useState } from "react";
import { createNewWallet } from "../services/walletService";
import { saveWallets, saveSelectedAccount } from "../services/storageService";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";

const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

function PasswordInput({ value, onChange, onKeyDown, placeholder, autoFocus }) {
    const [show, setShow] = useState(false);
    return (
        <div className="password-field">
            <input
                type={show ? "text" : "password"}
                className="form-control"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                autoFocus={autoFocus}
            />
            <button
                type="button"
                className="password-toggle"
                onClick={() => setShow((s) => !s)}
                tabIndex={-1}
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}

function Onboarding({ setStep, onWalletCreated }) {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!password) return toast.error("Please enter a password");
        if (password.length < 8) return toast.error("Password must be at least 8 characters");
        if (password !== confirm) return toast.error("Passwords do not match");

        try {
            setLoading(true);
            toast.info("Creating your wallet...");
            const wallet = await createNewWallet(password);
            await saveWallets([wallet]);
            await saveSelectedAccount(0);
            toast.success("Wallet created successfully!");
            if (onWalletCreated) onWalletCreated(wallet);
            setTimeout(() => setStep("unlock"), 400);
        } catch (err) {
            console.error(err);
            toast.error("Failed to create wallet");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleCreate();
    };

    return (
        <div className="page-centered">
            <div style={{ padding: "2rem 1.5rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏦</div>
                <h2 style={{ marginBottom: "0.375rem" }}>Create Your Wallet</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Your keys, your crypto. Set a strong password to encrypt your wallet.
                </p>
            </div>

            <div style={{ margin: "0 1rem 1rem" }}>
                <div className="card">
                    <div className="form-group">
                        <label>New Password</label>
                        <PasswordInput
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Min. 8 characters"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <PasswordInput
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Repeat your password"
                        />
                    </div>

                    <button className="btn-send" onClick={handleCreate} disabled={loading}>
                        {loading ? <TailSpin height={20} width={20} color="#fff" /> : "Create Wallet"}
                    </button>
                </div>

                <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.75rem 0" }}>
                    Your wallet is encrypted locally. Never share your password.
                </p>
            </div>
        </div>
    );
}

export default Onboarding;