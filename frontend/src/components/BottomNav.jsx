import React from 'react';
import { 
  LayoutDashboard, 
  ArrowDownRight, 
  ArrowUpRight, 
  CreditCard, 
  PiggyBank, 
  PieChart 
} from 'lucide-react';

export function BottomNav({ activeTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'expense', label: 'Expenses', icon: ArrowDownRight },
    { id: 'income', label: 'Income', icon: ArrowUpRight },
    { id: 'debt', label: 'Debts', icon: CreditCard },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'budget', label: 'Budgets', icon: PieChart },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
