import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { NETWORKS } from "../config/networks";
import { toast } from "react-toastify";

function Receive({ walletData, network, setStep }) {
    const [copied, setCopied] = useState(false);
    const net = NETWORKS[network];

    const handleCopy = () => {
        navigator.clipboard.writeText(walletData.address);
        setCopied(true);
        toast.success("Address copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Receive {net?.symbol}</h2>
                <p className="page-subtitle">Share your QR code or address to receive funds</p>
            </div>

            <div className="card">
                <div className="qr-wrapper">
                    <QRCodeCanvas
                        value={walletData.address}
                        size={180}
                        bgColor="#1c1c2a"
                        fgColor="#f6851b"
                        level="M"
                        style={{ borderRadius: 4 }}
                    />
                </div>

                <div className="form-group">
                    <label>Your Address</label>
                    <div className="address-display" onClick={handleCopy} title="Click to copy">
                        {walletData.address}
                    </div>
                </div>

                <button className="btn-send" onClick={handleCopy}>
                    {copied ? "Copied!" : "Copy Address"}
                </button>

                <button className="btn-ghost" onClick={() => setStep("dashboard")}>
                    Back to Dashboard
                </button>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.73rem", color: "var(--text-muted)", padding: "0.5rem" }}>
                Only send {net?.symbol} and compatible tokens to this address
            </div>
        </>
    );
}

export default Receive;