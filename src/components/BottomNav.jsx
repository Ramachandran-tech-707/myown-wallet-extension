const HomeIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "var(--accent)" : "none"} stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const SwapIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
);

const BuyIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const MenuIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
        <line x1="19" y1="11" x2="19" y2="17" />
        <line x1="22" y1="14" x2="16" y2="14" />
    </svg>
);

const NAV_ITEMS = [
    { id: "dashboard", label: "Home", Icon: HomeIcon },
    { id: "swap", label: "Swap", Icon: SwapIcon },
    { id: "buy", label: "Buy", Icon: BuyIcon },
    { id: "accounts", label: "Accounts", Icon: MenuIcon },
];

function BottomNav({ step, setStep, onAccountsClick }) {
    return (
        <nav className="bottom-nav">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
                const active = step === id;
                return (
                    <button
                        key={id}
                        className={`bottom-nav-item${active ? " active" : ""}`}
                        onClick={() => id === "accounts" ? onAccountsClick() : setStep(id)}
                    >
                        <Icon active={active} />
                        <span>{label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

export default BottomNav;