import React, { useState, useEffect } from 'react';
import './App.css';
import { useApi } from './hooks/useApi';
import { useTheme } from './hooks/useTheme';
import type { ThemePreference } from './lib/theme';
import { YearMonth, computePlanningMonth } from './lib/yearMonth';
import { useToast } from './components/ToastProvider';
import { useAuth } from './context/AuthContext';

// Importar páginas
import Login from './pages/Login';
import LoadingLogo from './components/LoadingLogo';
import logo from './assets/fintrack-logo.png';
import Dashboard from './pages/Dashboard';
import Months from './pages/Months';
import Fixed from './pages/Fixed';
import Cards from './pages/Cards';
import Savings from './pages/Savings';
import Agent from './pages/Agent';
import { FEATURE_PAYMENTS, FEATURE_SAVINGS } from './config/features';

// Navegação principal do aplicativo
const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'months', label: 'Meses', icon: '📅' },
  { id: 'fixed', label: 'Fixos', icon: '🔄' },
  ...(FEATURE_PAYMENTS ? [{ id: 'cards' as const, label: 'Cartões', icon: '💳' }] : []),
  ...(FEATURE_SAVINGS ? [{ id: 'savings' as const, label: 'Reservas', icon: '🏦' }] : []),
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
];

const themeOptions: { id: ThemePreference; label: string; icon: string }[] = [
  { id: 'light', label: 'Claro', icon: '☀️' },
  { id: 'dark', label: 'Escuro', icon: '🌙' },
  { id: 'system', label: 'Sistema', icon: '🖥️' },
];

function App() {
  const api = useApi();
  const toast = useToast();
  const { session, loading: authLoading, signOut } = useAuth();
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [planningMonth, setPlanningMonth] = useState<YearMonth | null>(null);
  const [payday, setPayday] = useState(1);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAgentModalClosing, setIsAgentModalClosing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openAgentModal = () => {
    setIsAgentModalClosing(false);
    setIsAgentModalOpen(true);
  };

  const closeAgentModal = () => {
    setIsAgentModalClosing(true);
    window.setTimeout(() => {
      setIsAgentModalOpen(false);
      setIsAgentModalClosing(false);
    }, 220);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const goToPlanningMonth = (newPayday: number) => {
    const planning = computePlanningMonth(newPayday);
    setPlanningMonth(planning);
    setSelectedYear(planning.year);
    setSelectedMonth(planning.month);
  };

  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        const settings = await api.settings.get();
        setPayday(settings.payday);
        goToPlanningMonth(settings.payday);
      } catch (err) {
        console.error('Erro ao inicializar:', err);
      }
    })();
  }, [session]);

  useEffect(() => {
    if (
      (!FEATURE_SAVINGS && currentPage === 'savings') ||
      (!FEATURE_PAYMENTS && currentPage === 'cards')
    ) {
      setCurrentPage('dashboard');
    }
  }, [currentPage]);

  useEffect(() => {
    if (!isAgentModalOpen) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAgentModal();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isAgentModalOpen]);

  const handleUpdatePayday = async (newPayday: number) => {
    try {
      await api.settings.update(newPayday);
      setPayday(newPayday);
      goToPlanningMonth(newPayday);
      toast.success('Dia do recebimento atualizado! O mês de planejamento foi ajustado.');
    } catch (err) {
      toast.error('Erro ao atualizar payday');
    }
  };

  // Renderiza a página atual
  const renderPage = () => {
    const pageProps = {
      selectedYear,
      selectedMonth,
      setSelectedYear,
      setSelectedMonth,
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} planningMonth={planningMonth} />;
      case 'months':
        return <Months {...pageProps} />;
      case 'fixed':
        return <Fixed selectedYear={selectedYear} selectedMonth={selectedMonth} />;
      case 'cards':
        return FEATURE_PAYMENTS ? <Cards /> : <Dashboard {...pageProps} />;
      case 'savings':
        return FEATURE_SAVINGS ? <Savings /> : <Dashboard {...pageProps} />;
      case 'agent':
        return <Dashboard {...pageProps} />;
      case 'settings':
        return (
          <div>
            <header className="page-header">
              <h1 className="page-title">Configurações</h1>
              <p className="page-subtitle">Ajustes globais do FinTrack</p>
            </header>
            <div className="card" style={{ maxWidth: '400px' }}>
              <div className="form-group">
                <label className="form-label">Dia do Recebimento (Payday)</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                  O sistema usará este dia para decidir qual mês você está planejando ao abrir o app.
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="1" 
                    max="31" 
                    value={payday}
                    onChange={(e) => setPayday(parseInt(e.target.value))}
                  />
                  <button className="btn btn-primary" onClick={() => handleUpdatePayday(payday)}>Salvar</button>
                </div>
              </div>
            </div>
            <div className="card" style={{ maxWidth: '400px', marginTop: 'var(--spacing-lg)' }}>
              <h2 id="theme-heading" style={{ fontSize: '1rem', marginBottom: 'var(--spacing-xs)' }}>
                Aparência
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Em “Sistema”, o tema acompanha a configuração do seu dispositivo.
              </p>
              <div className="theme-switcher" role="radiogroup" aria-labelledby="theme-heading">
                {themeOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`theme-option ${themePreference === option.id ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={option.id}
                      checked={themePreference === option.id}
                      onChange={() => setThemePreference(option.id)}
                    />
                    <span className="theme-option-icon" aria-hidden>
                      {option.icon}
                    </span>
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="card" style={{ maxWidth: '400px', marginTop: 'var(--spacing-lg)' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Conta</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                {session?.user.email}
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  await signOut();
                  toast.success('Você saiu da conta.');
                }}
              >
                Sair
              </button>
            </div>
          </div>
        );
      default:
        return <Dashboard {...pageProps} />;
    }
  };

  if (authLoading) return <LoadingLogo />;
  if (!session) return <Login />;

  return (
    <div className={`app-container ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      {/* Sidebar de Navegação */}
      <aside className="sidebar">
        <div className="logo">
          <img className="logo-image" src={logo} alt="FinTrack" />
          Fin<span>Track</span>
        </div>

        <nav id="sidebar-navigation">
          <ul className="nav-menu">
            {navigation.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => {
                    if (item.id === 'agent') {
                      openAgentModal();
                      closeMobileMenu();
                      return;
                    }
                    setCurrentPage(item.id);
                    closeMobileMenu();
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden
      />

      {/* Conteúdo Principal */}
      <main className="main-content">
        <div className="mobile-topbar">
          <button
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="sidebar-navigation"
          >
            ☰
          </button>
        </div>
        {renderPage()}
      </main>

      <button
        className="agent-fab"
        onClick={openAgentModal}
        title="Abrir Agente IA"
        aria-label="Abrir Agente IA"
        aria-hidden
        style={{ display: 'none' }}
      >
        🤖
      </button>

      {isAgentModalOpen && (
        <div
          className={`agent-modal-overlay ${isAgentModalClosing ? 'closing' : 'open'}`}
          onClick={closeAgentModal}
        >
          <div
            className={`agent-modal-balloon ${isAgentModalClosing ? 'closing' : 'open'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="agent-modal-header">
              <div>
                <h2 className="agent-modal-title">Assistente Financeiro IA</h2>
                <p className="agent-modal-subtitle">
                  Faça lançamentos e ajustes por conversa natural.
                </p>
              </div>
              <button className="agent-modal-close" onClick={closeAgentModal} aria-label="Fechar agente">
                ✕
              </button>
            </header>
            <Agent embedded />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
