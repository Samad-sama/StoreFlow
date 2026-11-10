import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserCog,
  Plus,
  Shield,
  Key,
  UserCheck,
  Trash2,
  Edit,
  X,
  History,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  username: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier' | 'inventory';
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export const Employees: React.FC = () => {
  const { t } = useTranslation(['common', 'nav']);

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 'emp-1',
      name: 'المدير العام / Admin Owner',
      username: 'owner',
      role: 'owner',
      phone: '+212 600 000000',
      email: 'owner@storeflow.com',
      status: 'active',
    },
    {
      id: 'emp-2',
      name: 'أمين الصندوق (كاشير 1)',
      username: 'cashier1',
      role: 'cashier',
      phone: '+212 611 111111',
      email: 'cashier1@storeflow.com',
      status: 'active',
    },
    {
      id: 'emp-3',
      name: 'مسؤول المستودع والجرد',
      username: 'inventory',
      role: 'inventory',
      phone: '+212 622 222222',
      email: 'inventory@storeflow.com',
      status: 'active',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'cashier' | 'inventory'>('cashier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setEmployees((prev) => [
      ...prev,
      {
        id: `emp-${Date.now()}`,
        name,
        username,
        role,
        phone,
        email,
        status: 'active',
      },
    ]);

    setIsModalOpen(false);
    setName('');
    setUsername('');
    setPhone('');
    setEmail('');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('nav:employees')} والصلاحيات</h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            إدارة حسابات الكاشير والمشرفين والصلاحيات وسجل الدخول ({employees.length} مستخدم)
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="apple-btn-primary self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="apple-card p-5 apple-card-hover flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20">
                  <UserCog size={17} className="stroke-[2.2]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="apple-badge apple-badge-green">
                    <CheckCircle2 size={10} />
                    نشط
                  </span>
                  {emp.role !== 'owner' && (
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-sm text-foreground tracking-tight mb-0.5">{emp.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">@{emp.username}</p>

              <div className="mt-3">
                <span className="apple-badge apple-badge-blue">
                  {emp.role === 'owner'
                    ? 'مالك النظام (Owner)'
                    : emp.role === 'cashier'
                    ? 'أمين الصندوق (Cashier)'
                    : emp.role === 'inventory'
                    ? 'مسؤول المخزن (Inventory)'
                    : 'مدير (Manager)'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.05] mt-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2">
                <Phone size={12} className="shrink-0" />
                <span className="tabular-nums">{emp.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={12} className="shrink-0" />
                <span className="truncate">{emp.email || '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Overview Note */}
      <div className="apple-card p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
        <Shield size={18} className="text-primary shrink-0 mt-0.5 stroke-[2.2]" />
        <div>
          <strong className="text-foreground block mb-0.5 font-bold">نموذج المصادقة والتصاريح في نسخة الويب:</strong>
          تعتمد نسخة الويب الحالية على نموذج المصادقة المحلي الآمن (Local Demo Model). يتم تطبيق تصاريح الوصول وتعيين الأدوار محلياً تمهيداً لربطها بنظام قاعدة بيانات SQLite ومحرك Tauri عند الانتقال للنسخة المكتبية مستقبلاً.
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-black/[0.08] dark:border-white/[0.09] shadow-apple-modal p-6 text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-black/[0.04] dark:border-white/[0.05] pb-3">
              <h2 className="text-base font-bold text-foreground tracking-tight">إضافة موظف / كاشير جديد</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم الموظف..."
                  className="apple-input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">اسم المستخدم للولوج (Username) *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cashier2..."
                  className="apple-input w-full font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-foreground mb-1">الدور / الصلاحية</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="apple-select w-full"
                >
                  <option value="cashier">أمين صندوق (Cashier) - صلاحيات نقطة البيع فقط</option>
                  <option value="inventory">مسؤول مخزون (Inventory) - جرد وإضافة بضائع</option>
                  <option value="manager">مدير فرع (Manager) - صلاحيات متقدمة</option>
                  <option value="admin">مشرف عام (Admin) - كافة الصلاحيات</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6..."
                    className="apple-input w-full tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@storeflow.com"
                    className="apple-input w-full"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.05] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="apple-btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="apple-btn-primary"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
