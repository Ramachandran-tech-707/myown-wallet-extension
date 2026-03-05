import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TailSpin } from "react-loader-spinner";

import Onboarding from "./pages/Onboarding";
import Unlock from "./pages/Unlock";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Confirm from "./pages/Confirm";
import Receive from "./pages/Receive";
import Swap from "./pages/Swap";
import Buy from "./pages/Buy";
import ImportAccount from "./pages/ImportAccount";
import AccountDetails from "./pages/AccountDetails";
import Layout from "./components/Layout";

import {
  getWallets, getSelectedNetwork, getSelectedAccount,
  saveSelectedNetwork, saveSelectedAccount, restoreFromBackup, clearAll,
} from "./services/storageService";
import { registerDevice, fetchBackup, clearToken } from "./services/apiService";
import { fetchBalance } from "./services/networkService";
import { NETWORKS, getNetwork } from "./config/networks";

const LAYOUT_STEPS = [
  "dashboard", "send", "confirm", "receive", "swap", "buy", "importAccount", "accountDetails"
];

function App() {
  const [step, setStep] = useState("loading");
  const [wallets, setWallets] = useState([]);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [network, setNetwork] = useState("ethereum");
  const [txData, setTxData] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // ── Boot ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Register device first — JWT must exist before any sync calls
        await registerDevice().catch(() => { });

        const [storedWallets, savedNetwork] = await Promise.all([
          getWallets(), getSelectedNetwork(),
        ]);
        const net = savedNetwork || "ethereum";
        setNetwork(net);

        if (storedWallets?.length > 0) {
          // Local storage has wallets — proceed normally
          const selectedIdx = await getSelectedAccount();
          const wallet = storedWallets[selectedIdx] || storedWallets[0];
          setWallets(storedWallets);
          setCurrentWallet(wallet);
          setStep("unlock");
        } else {
          // 2. Local is empty — try restoring from MongoDB backup
          try {
            const backup = await fetchBackup();
            if (backup?.wallets?.length) {
              await restoreFromBackup();
              const restored = await getWallets();
              if (restored.length > 0) {
                const idx = await getSelectedAccount();
                setWallets(restored);
                setCurrentWallet(restored[idx] || restored[0]);
                setStep("unlock");
                toast.info("Wallet restored from cloud backup");
                return;
              }
            }
          } catch { /* backup unavailable — proceed to onboarding */ }

          setStep("onboarding");
        }
      } catch {
        toast.error("Failed to initialize. Please reload.");
        setStep("onboarding");
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  // ── Balance ───────────────────────────────────────────
  useEffect(() => {
    if (!currentWallet?.address || !NETWORKS[network]) return;
    let cancelled = false;
    setLoadingBalance(true);
    fetchBalance(currentWallet.address, network).then((bal) => {
      if (!cancelled) {
        setBalance(bal);
        setLoadingBalance(false);
      }
    });
    return () => { cancelled = true; };
  }, [currentWallet?.address, network]);

  // ── Handlers ──────────────────────────────────────────
  const handleNetworkChange = async (newNetwork) => {
    setNetwork(newNetwork);
    await saveSelectedNetwork(newNetwork);
    toast.info(`Switched to ${NETWORKS[newNetwork]?.name || newNetwork}`);
  };

  const handleWalletChange = async (wallet) => {
    const idx = wallets.findIndex((w) => w.address === wallet.address);
    setCurrentWallet(wallet);
    if (idx >= 0) await saveSelectedAccount(idx);
  };

  const handleWalletCreated = async (wallet) => {
    const fresh = await getWallets();
    setWallets(fresh);
    setCurrentWallet(fresh[0] || wallet);
  };

  const handleUnlocked = (wallet) => {
    setCurrentWallet(wallet);
  };

  // ── Logout: lock wallet, clear session ───────────────
  const handleLogout = async () => {
    clearToken();              // remove JWT from localStorage
    await clearAll();          // clear local storage / chrome.storage
    setWallets([]);
    setCurrentWallet(null);
    setBalance(null);
    setTxData(null);
    setStep("unlock");     // go back to onboarding (re-detect wallets on next boot)
  };

  // ── Loading ───────────────────────────────────────────
  if (initializing) {
    return (
      <div className="loader-fullscreen">
        <TailSpin height={50} width={50} color="#f6851b" />
      </div>
    );
  }

  // ── Onboarding ────────────────────────────────────────
  if (step === "onboarding") {
    return (
      <>
        <div className="app-shell" style={{ justifyContent: "center" }}>
          <Onboarding setStep={setStep} onWalletCreated={handleWalletCreated} />
        </div>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </>
    );
  }

  // ── Unlock ────────────────────────────────────────────
  if (step === "unlock") {
    return (
      <>
        <div className="app-shell" style={{ justifyContent: "center" }}>
          <Unlock setWallet={handleUnlocked} setStep={setStep} />
        </div>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </>
    );
  }

  // ── Main App ──────────────────────────────────────────
  if (LAYOUT_STEPS.includes(step)) {
    return (
      <>
        <Layout
          network={network}
          setNetwork={handleNetworkChange}
          wallets={wallets}
          setWallets={setWallets}
          currentWallet={currentWallet}
          setCurrentWallet={handleWalletChange}
          step={step}
          setStep={setStep}
          onLogout={handleLogout}
        >
          {step === "dashboard" && (
            <Dashboard
              setStep={setStep}
              walletData={currentWallet}
              network={network}
              balance={balance}
              loadingBalance={loadingBalance}
            />
          )}
          {step === "send" && (
            <Send wallet={currentWallet} network={network} setStep={setStep} setTxData={setTxData} />
          )}
          {step === "confirm" && txData && (
            <Confirm txData={txData} walletData={currentWallet} network={network} setStep={setStep} />
          )}
          {step === "receive" && (
            <Receive walletData={currentWallet} network={network} setStep={setStep} />
          )}
          {step === "swap" && (
            <Swap network={network} walletData={currentWallet} balance={balance} />
          )}
          {step === "buy" && (
            <Buy network={network} walletData={currentWallet} />
          )}
          {step === "importAccount" && (
            <ImportAccount
              setStep={setStep}
              wallets={wallets}
              setWallets={setWallets}
              setCurrentWallet={setCurrentWallet}
            />
          )}
          {step === "accountDetails" && (
            <AccountDetails
              walletData={currentWallet}
              wallets={wallets}
              setWallets={setWallets}
              setCurrentWallet={setCurrentWallet}
              setStep={setStep}
              network={network}
            />
          )}
        </Layout>
        <ToastContainer
          position="top-right" autoClose={3000}
          hideProgressBar={false} newestOnTop
          closeOnClick pauseOnHover draggable theme="dark"
        />
      </>
    );
  }

  return null;
}

export default App;