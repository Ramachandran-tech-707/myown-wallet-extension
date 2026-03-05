import { useEffect, useState } from "react";
import { getWallets, saveSelectedAccount } from "../services/storageService";

function AccountSelector({ setCurrentWallet }) {
    const [wallets, setWallets] = useState([]);

    useEffect(() => {
        getWallets().then(setWallets);
    }, []);

    const handleSelect = (index) => {
        saveSelectedAccount(index);
        setCurrentWallet(wallets[index]);
    };

    return (
        <select onChange={(e) => handleSelect(e.target.value)}>
            {wallets.map((w, i) => (
                <option key={i} value={i}>
                    Account {i + 1}
                </option>
            ))}
        </select>
    );
}

export default AccountSelector;