import { useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { toast } from "react-toastify";
import { reEncryptWallet } from "../services/walletService";
import { getWallets, saveWallets } from "../services/storageService";
import PasswordInput from "../components/PasswordInput";
import { ethers } from "ethers";

// steps: "intro" → "enter-key" → "new-password" → "done"
function ForgotPassword({ setStep }) {
    
    const [stage, setStage] = useState("intro");
    const [privateKey, setPrivateKey] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [keyError, setKeyError] = useState("");

    // validate private key format live
    const validateKey = (val) => {
        setPrivateKey(val);
        setKeyError("");
        if (!val) return;
        try {
            const k = val.startsWith("0x") ? val : `0x${val}`;
            new ethers.Wallet(k);
        } catch {
            setKeyError("Invalid private key format");
        }
    };

    const handleVerifyKey = () => {
        if (!privateKey) return toast.error("Enter your private key");
        if (keyError) return toast.error("Fix the private key first");
        setStage("new-password");
    };

    const handleReset = async () => {
        if (!newPassword) return toast.error("Enter a new password");
        if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
        if (newPassword !== confirmPw) return toast.error("Passwords do not match");

        try {
            setLoading(true);
            toast.info("Re-encrypting wallets…");

            const existing = await getWallets();

            // Re-encrypt every wallet whose address matches the supplied private key's address.
            // Other wallets that don't match are kept as-is (they need their own key to reset).
            const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
            const signerWallet = new ethers.Wallet(key);
            const signerAddress = signerWallet.address.toLowerCase();

            const updated = await Promise.all(
                existing.map(async (w) => {
                    if (w.address.toLowerCase() === signerAddress) {
                        const reEncrypted = await reEncryptWallet(privateKey, newPassword);
                        return reEncrypted;
                    }
                    return w; // unchanged — different account
                })
            );

            await saveWallets(updated);
            setPrivateKey(""); // wipe from memory
            setStage("done");
            toast.success("Password reset successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to reset password. Check your private key.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-centered">
            {/* ── Header ─────────────────────── */}
            <div style={{ padding: "2rem 1.5rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
                    {stage === "done" ? "✅" : "🔑"}
                </div>
                <h2 style={{ marginBottom: "0.375rem" }}>
                    {stage === "done" ? "Password Reset!" : "Forgot Password"}
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {stage === "intro" && "To reset your password you need to prove ownership of your wallet using its private key."}
                    {stage === "enter-key" && "Paste your private key below. It never leaves your device."}
                    {stage === "new-password" && "Set a new password to encrypt your wallet."}
                    {stage === "done" && "Your wallet has been re-encrypted with your new password."}
                </p>
            </div>

            <div style={{ margin: "0 1rem 1rem" }}>
                {/* ── Stage: Intro ─────────────── */}
                {stage === "intro" && (
                    <div className="card" style={{ gap: "1rem" }}>
                        {/* Warning box */}
                        <div className="import-warning">
                            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                            <p>
                                <strong>Your private key is your ultimate proof of wallet ownership.</strong>{" "}
                                Never share it with anyone. This process happens entirely on your device — nothing is sent to any server.
                            </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {[
                                { icon: "1️⃣", text: "Enter the private key for the account you want to recover" },
                                { icon: "2️⃣", text: "Set a new password to re-encrypt your wallet" },
                                { icon: "3️⃣", text: "Unlock normally with your new password" },
                            ].map(({ icon, text }) => (
                                <div key={icon} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                    <span style={{ fontSize: "1rem", lineHeight: 1.5, flexShrink: 0 }}>{icon}</span>
                                    <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{text}</span>
                                </div>
                            ))}
                        </div>

                        <button className="btn-send" onClick={() => setStage("enter-key")}>
                            Continue
                        </button>
                        <button
                            className="btn-ghost"
                            style={{ marginTop: "-0.25rem" }}
                            onClick={() => setStep("unlock")}
                        >
                            Back to Unlock
                        </button>
                    </div>
                )}

                {/* ── Stage: Enter Private Key ─── */}
                {stage === "enter-key" && (
                    <div className="card">
                        <div className="form-group">
                            <label>Private Key</label>
                            <div className="password-field">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="0x… or without prefix"
                                    value={privateKey}
                                    onChange={(e) => validateKey(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleVerifyKey()}
                                    autoFocus
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                            </div>
                            {keyError && (
                                <span style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.25rem" }}>
                                    {keyError}
                                </span>
                            )}
                        </div>

                        {/* Security note */}
                        <div style={{
                            background: "rgba(34,197,94,0.06)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.65rem 0.875rem",
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "flex-start",
                        }}>
                            <span style={{ color: "var(--success)", fontSize: "0.9rem", flexShrink: 0 }}>🔒</span>
                            <p style={{ fontSize: "0.75rem", color: "var(--success)", margin: 0, lineHeight: 1.5 }}>
                                Your key is processed locally only. It is never transmitted or stored in plain text.
                            </p>
                        </div>

                        <button
                            className="btn-send"
                            onClick={handleVerifyKey}
                            disabled={!!keyError || !privateKey}
                        >
                            Verify Key
                        </button>
                        <button
                            className="btn-ghost"
                            style={{ marginTop: "-0.25rem" }}
                            onClick={() => setStage("intro")}
                        >
                            Back
                        </button>
                    </div>
                )}

                {/* ── Stage: New Password ───────── */}
                {stage === "new-password" && (
                    <div className="card">
                        <div className="form-group">
                            <label>New Password</label>
                            <PasswordInput
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <PasswordInput
                                value={confirmPw}
                                onChange={(e) => setConfirmPw(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                                placeholder="Repeat new password"
                            />
                        </div>

                        {/* Strength indicator */}
                        {newPassword.length > 0 && (
                            <div>
                                <div style={{ display: "flex", gap: "4px", marginBottom: "0.3rem" }}>
                                    {[1, 2, 3, 4].map((n) => (
                                        <div key={n} style={{
                                            flex: 1,
                                            height: 3,
                                            borderRadius: 2,
                                            background: newPassword.length >= n * 3
                                                ? n <= 1 ? "var(--error)"
                                                    : n <= 2 ? "var(--warning)"
                                                        : n <= 3 ? "#84cc16"
                                                            : "var(--success)"
                                                : "var(--bg-hover)",
                                            transition: "background 0.2s",
                                        }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    {newPassword.length < 4 ? "Too short" :
                                        newPassword.length < 8 ? "Weak" :
                                            newPassword.length < 12 ? "Good" : "Strong"}
                                </span>
                            </div>
                        )}

                        <button className="btn-send" onClick={handleReset} disabled={loading}>
                            {loading
                                ? <><TailSpin height={18} width={18} color="#fff" /> Resetting…</>
                                : "Reset Password"}
                        </button>
                        <button
                            className="btn-ghost"
                            style={{ marginTop: "-0.25rem" }}
                            onClick={() => setStage("enter-key")}
                            disabled={loading}
                        >
                            Back
                        </button>
                    </div>
                )}

                {/* ── Stage: Done ──────────────── */}
                {stage === "done" && (
                    <div className="card" style={{ alignItems: "center", textAlign: "center", gap: "1.25rem" }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: "rgba(34,197,94,0.12)",
                            border: "1px solid rgba(34,197,94,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.75rem",
                        }}>
                            ✅
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                Your wallet is now protected with your new password. Use it to unlock as normal.
                            </span>
                        </div>
                        <button className="btn-send" style={{ width: "100%" }} onClick={() => setStep("unlock")}>
                            Go to Unlock
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;