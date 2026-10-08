import React, { useState, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { LoginModal } from './components/LoginModal';
import { TablesView } from './components/TablesView';
import { OrderCreatorView } from './components/OrderCreatorView';
import { TableDetailModal } from './components/TableDetailModal';
import { TableTransferMergeModal } from './components/TableTransferMergeModal';
import { TableQRModal } from './components/TableQRModal';
import { BillCheckoutModal } from './components/BillCheckoutModal';
import { KDSView } from './components/KDSView';
import { DashboardView } from './components/DashboardView';
import { OrdersListView } from './components/OrdersListView';
import { PaymentsListView } from './components/PaymentsListView';
import { ProductManagementView } from './components/ProductManagementView';
import { CategoryManagementView } from './components/CategoryManagementView';
import { StockManagementView } from './components/StockManagementView';
import { StaffManagementView } from './components/StaffManagementView';
import { CashRegisterView } from './components/CashRegisterView';
import { ReportsView } from './components/ReportsView';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';
import { BillingView } from './components/BillingView';
import { ReservationsView } from './components/ReservationsView';
import { WaiterMobileView } from './components/WaiterMobileView';
import { SuperAdminView } from './components/SuperAdminView';
import { RestaurantTable, DEFAULT_ROLE_PERMISSIONS } from './types';
import { Menu, X, Grid3X3, UtensilsCrossed, Flame, Wallet } from 'lucide-react';

const POSAppContent: React.FC = () => {
  const { currentUser, theme, isWaiterMobileMode, getUserEffectiveTabs, orders, tables } = usePOS();
  
  // Persist active tab across actions, reloads, and state refreshes
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('patron_pos_active_tab');
      if (saved) return saved as ActiveTab;
    } catch {
      // ignore
    }
    return 'dashboard';
  });

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('patron_pos_active_tab', tab);
    } catch {
      // ignore
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Auto-switch to first available allowed tab when user logs in or permissions change
  useEffect(() => {
    if (!currentUser) return;
    const allowed = getUserEffectiveTabs(currentUser);

    if (allowed.length > 0 && !allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  }, [currentUser, getUserEffectiveTabs, activeTab]);

  // Modal / Sub-view states
  const [orderingTable, setOrderingTable] = useState<RestaurantTable | null>(null);
  const [detailTable, setDetailTable] = useState<RestaurantTable | null>(null);
  const [checkoutTable, setCheckoutTable] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [transferMergeModal, setTransferMergeModal] = useState<{
    type: 'transfer' | 'merge';
    table: RestaurantTable;
  } | null>(null);

  // If user is not authenticated, show login modal
  if (!currentUser) {
    return <LoginModal />;
  }

  // If user is a WAITER or Waiter Mobile Mode is toggled on, show Waiter Mobile UI
  if (currentUser.role === 'WAITER' || isWaiterMobileMode) {
    return (
      <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased ${theme}`}>
        <ToastContainer />
        <WaiterMobileView />
      </div>
    );
  }

  const handleSelectTableForOrder = (table: RestaurantTable) => {
    setDetailTable(null);
    setOrderingTable(table);
  };

  const handleOpenTableDetail = (table: RestaurantTable) => {
    setDetailTable(table);
  };

  const handleOpenBillCheckout = (table: RestaurantTable) => {
    setDetailTable(null);
    setCheckoutTable(table);
  };

  const handleOpenTransferMerge = (type: 'transfer' | 'merge', table: RestaurantTable) => {
    setDetailTable(null);
    setTransferMergeModal({ type, table });
  };

  const handleOpenQRModal = (table: RestaurantTable) => {
    setQrTable(table);
  };

  const activeOrdersCount = orders.filter((o) => o.status === 'ACTIVE').length;
  const kitchenPendingCount = orders
    .filter((o) => o.status === 'ACTIVE')
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'PREPARING' || i.status === 'PENDING').length;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950 ${theme}`}>
      <ToastContainer />
      <Header
        onNavigateToKDS={() => setActiveTab('kitchen')}
        onNavigateTab={setActiveTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Navigation Sidebar - Desktop Permanent */}
        <div className="hidden lg:block shrink-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Mobile Navigation Drawer - Slide-over on < lg */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl">
              <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <span className="font-extrabold text-sm bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                  ÖZER POS MENÜ
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                isMobileDrawer={true}
              />
            </div>
          </div>
        )}

        {/* Content View Container */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto w-full">
            {/* If actively ordering for a table, display Order Creator */}
            {orderingTable ? (
              <OrderCreatorView
                table={orderingTable}
                onBack={() => setOrderingTable(null)}
                onOrderCompleted={() => {
                  setOrderingTable(null);
                }}
              />
            ) : (
              <>
                {activeTab === 'super-admin' && <SuperAdminView />}

                {activeTab === 'dashboard' && (
                  <DashboardView
                    onOpenTable={() => setActiveTab('tables')}
                    onOpenKitchen={() => setActiveTab('kitchen')}
                  />
                )}

                {activeTab === 'tables' && (
                  <TablesView
                    onSelectTableForOrder={handleSelectTableForOrder}
                    onOpenTableDetail={handleOpenTableDetail}
                    onOpenBillCheckout={handleOpenBillCheckout}
                    onOpenTransferMerge={handleOpenTransferMerge}
                    onOpenQRModal={handleOpenQRModal}
                  />
                )}

                {activeTab === 'reservations' && (
                  <ReservationsView
                    onOpenTableForOrder={(tableId) => {
                      const t = tables.find((tbl) => tbl.id === tableId);
                      if (t) handleSelectTableForOrder(t);
                    }}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrdersListView
                    onOpenTableDetail={handleOpenTableDetail}
                    onOpenOrderCreator={handleSelectTableForOrder}
                    onOpenCheckout={handleOpenBillCheckout}
                  />
                )}

                {activeTab === 'kitchen' && <KDSView />}

                {activeTab === 'products' && <ProductManagementView />}

                {activeTab === 'categories' && <CategoryManagementView />}

                {activeTab === 'stock' && <StockManagementView />}

                {activeTab === 'staff' && <StaffManagementView />}

                {activeTab === 'payments' && (
                  <PaymentsListView onOpenCheckout={handleOpenBillCheckout} />
                )}

                {activeTab === 'cash-register' && <CashRegisterView />}

                {activeTab === 'reports' && <ReportsView />}

                {activeTab === 'audit-logs' && <AuditLogsView />}

                {activeTab === 'settings' && <SettingsView />}
                {activeTab === 'billing' && <BillingView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {detailTable && (
        <TableDetailModal
          table={detailTable}
          onClose={() => setDetailTable(null)}
          onAddOrder={(tbl) => handleSelectTableForOrder(tbl)}
          onOpenCheckout={(tbl) => handleOpenBillCheckout(tbl)}
          onOpenTransferMerge={(type, tbl) => handleOpenTransferMerge(type, tbl)}
        />
      )}

      {checkoutTable && (
        <BillCheckoutModal
          table={checkoutTable}
          onClose={() => setCheckoutTable(null)}
          onPaymentCompleted={() => {
            setCheckoutTable(null);
          }}
        />
      )}

      {transferMergeModal && (
        <TableTransferMergeModal
          type={transferMergeModal.type}
          sourceTable={transferMergeModal.table}
          onClose={() => setTransferMergeModal(null)}
        />
      )}

      {qrTable && (
        <TableQRModal
          table={qrTable}
          onClose={() => setQrTable(null)}
        />
      )}

      {/* Mobile Sticky Bottom Navigation Bar (Hidden on Desktop >= lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setOrderingTable(null);
            setActiveTab('tables');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[56px] ${
            activeTab === 'tables' && !orderingTable ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid3X3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Masalar</span>
        </button>

        <button
          onClick={() => {
            setOrderingTable(null);
            setActiveTab('orders');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[56px] relative ${
            activeTab === 'orders' || orderingTable ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sipariş</span>
          {activeOrdersCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => {
            setOrderingTable(null);
            setActiveTab('kitchen');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[56px] relative ${
            activeTab === 'kitchen' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Mutfak</span>
          {kitchenPendingCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => {
            setOrderingTable(null);
            setActiveTab('cash-register');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[56px] ${
            activeTab === 'cash-register' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Kasa</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors min-w-[56px]"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menü</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSAppContent />
    </POSProvider>
  );
}
