import React, { useState, useEffect } from 'react';
import './App.css';
import { useApi } from './hooks/useApi';
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

// Navegação principal do aplicativo
const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'months', label: 'Meses', icon: '📅' },
  { id: 'fixed', label: 'Fixos', icon: '🔄' },
  { id: 'cards', label: 'Cartões', icon: '💳' },
  { id: 'savings', label: 'Reservas', icon: '🏦' },
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
];

function App() {
  const api = useApi();
  const toast = useToast();
  const { session, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
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

  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        const settings = await api.settings.get();
        setPayday(settings.payday);

        const today = new Date();
        const currentDay = today.getDate();
        const planningDate = new Date();
        if (currentDay > settings.payday) {
          planningDate.setMonth(today.getMonth() + 1);
        } else {
          planningDate.setMonth(today.getMonth());
        }

        setSelectedYear(planningDate.getFullYear());
        setSelectedMonth(planningDate.getMonth() + 1);
      } catch (err) {
        console.error('Erro ao inicializar:', err);
      }
    })();
  }, [session]);

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
      
      // Recalcula o mês de planejamento imediatamente após a atualização
      const today = new Date();
      const currentDay = today.getDate();
      const planningDate = new Date();
      if (currentDay > newPayday) {
        planningDate.setMonth(today.getMonth() + 1);
      } else {
        planningDate.setMonth(today.getMonth());
      }
      setSelectedYear(planningDate.getFullYear());
      setSelectedMonth(planningDate.getMonth() + 1);
      
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
        return <Dashboard {...pageProps} />;
      case 'months':
        return <Months {...pageProps} />;
      case 'fixed':
        return <Fixed selectedYear={selectedYear} selectedMonth={selectedMonth} />;
      case 'cards':
        return <Cards />;
      case 'savings':
        return <Savings />;
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
