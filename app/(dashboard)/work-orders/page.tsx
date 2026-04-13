'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/language-context';

interface WorkOrderItem {
  id?: string;
  type: string;
  opSph: string; opCyl: string; opAxis: string; opAdd: string; opPd: string;
  olSph: string; olCyl: string; olAxis: string; olAdd: string; olPd: string;
  frameModel: string;
  ownFrame: boolean;
  lensType: string;
  framePrice: string;
  lensPrice: string;
}

interface WorkOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  receivedAt: string;
  dueAt: string | null;
  status: string;
  totalAmount: string | null;
  deposit: string | null;
  notes: string | null;
  items: WorkOrderItem[];
}

interface Customer {
  id: string;
  name: string;
  surname: string;
  phone: string;
}

const ITEM_TYPES = [
  { value: 'do_dali', labelKey: 'lensTypeDali' },
  { value: 'do_blizy', labelKey: 'lensTypeBlizy' },
  { value: 'progresywne', labelKey: 'lensTypeProgresywne' },
  { value: 'soczewki_kontaktowe', labelKey: 'lensTypeSoczewki' },
];

const STATUSES = [
  { value: 'pending', labelKey: 'orderPending' },
  { value: 'ready', labelKey: 'orderReady' },
  { value: 'completed', labelKey: 'orderCompleted' },
];

function emptyItem(): WorkOrderItem {
  return {
    type: 'do_dali',
    opSph: '', opCyl: '', opAxis: '', opAdd: '', opPd: '',
    olSph: '', olCyl: '', olAxis: '', olAdd: '', olPd: '',
    frameModel: '', ownFrame: false, lensType: '', framePrice: '', lensPrice: '',
  };
}

function emptyForm() {
  return {
    customerId: '',
    receivedAt: new Date().toISOString().split('T')[0],
    dueAt: '',
    status: 'pending',
    totalAmount: '',
    deposit: '',
    notes: '',
    items: [emptyItem()],
  };
}

export default function WorkOrdersPage() {
  const { t } = useLanguage();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', surname: '', phone: '', email: '', smsConsent: true });
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    fetchWorkOrders();
    fetchCustomers();
  }, []);

  async function fetchWorkOrders() {
    try {
      const res = await fetch('/api/work-orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWorkOrders(data.workOrders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {}
  }

  function openAdd() {
    setEditingOrder(null);
    setForm(emptyForm());
    setCustomerSearch('');
    setShowNewCustomerForm(false);
    setNewCustomer({ name: '', surname: '', phone: '', email: '', smsConsent: true });
    setShowModal(true);
  }

  function openEdit(order: WorkOrder) {
    setEditingOrder(order);
    setForm({
      customerId: order.customerId,
      receivedAt: order.receivedAt.split('T')[0],
      dueAt: order.dueAt ? order.dueAt.split('T')[0] : '',
      status: order.status,
      totalAmount: order.totalAmount ?? '',
      deposit: order.deposit ?? '',
      notes: order.notes ?? '',
      items: order.items.length > 0 ? order.items.map(i => ({
        id: i.id,
        type: i.type,
        opSph: i.opSph ?? '', opCyl: i.opCyl ?? '', opAxis: i.opAxis ?? '', opAdd: i.opAdd ?? '', opPd: i.opPd ?? '',
        olSph: i.olSph ?? '', olCyl: i.olCyl ?? '', olAxis: i.olAxis ?? '', olAdd: i.olAdd ?? '', olPd: i.olPd ?? '',
        frameModel: i.frameModel ?? '', ownFrame: i.ownFrame ?? false, lensType: i.lensType ?? '', framePrice: i.framePrice ?? '', lensPrice: i.lensPrice ?? '',
      })) : [emptyItem()],
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingOrder(null);
    setCustomerSearch('');
    setShowNewCustomerForm(false);
    setNewCustomer({ name: '', surname: '', phone: '', email: '', smsConsent: true });
  }

  function setItemField(index: number, field: keyof WorkOrderItem, value: any) {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(index: number) {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let customerId = form.customerId;

      // Jeśli formularz nowego klienta jest wypełniony — najpierw utwórz klienta
      if (showNewCustomerForm) {
        if (!newCustomer.name || !newCustomer.surname || !newCustomer.phone) {
          setError(t('nameRequiredError'));
          setSubmitting(false);
          return;
        }
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomer),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        customerId = data.customer.id;
        await fetchCustomers();
      }

      if (!customerId) { setError(t('pleaseSelectCustomer')); setSubmitting(false); return; }

      const payload = { ...form, customerId };
      const url = '/api/work-orders';
      const method = editingOrder ? 'PATCH' : 'POST';
      const body = editingOrder ? { id: editingOrder.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchWorkOrders();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendReviewSms(workOrderId: string) {
    setSendingSmsId(workOrderId);
    try {
      const res = await fetch('/api/work-orders/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
      alert(t('reviewSmsSent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS');
    } finally {
      setSendingSmsId(null);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch('/api/work-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      await fetchWorkOrders();
    } catch {
      setError('Failed to update status');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('areYouSureWorkOrder'))) return;
    try {
      const res = await fetch(`/api/work-orders?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchWorkOrders();
    } catch {
      setError('Failed to delete work order');
    }
  }

  function statusLabel(status: string) {
    const s = STATUSES.find(s => s.value === status);
    return s ? t(s.labelKey as any) : status;
  }

  function statusColor(status: string) {
    if (status === 'ready') return 'bg-green-100 text-green-800';
    if (status === 'completed') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  function typeLabel(type: string) {
    const it = ITEM_TYPES.find(i => i.value === type);
    return it ? t(it.labelKey as any) : type;
  }

  const filtered = workOrders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q);
    });

  if (loading) return <div className="p-6">{t('loadingWorkOrders')}</div>;

  return (
    <div className="text-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('workOrdersTitle')}</h1>
          <p className="text-gray-600">{t('workOrdersSubtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('addWorkOrder')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {[
          { value: 'all', label: t('allOrders') },
          { value: 'pending', label: t('pendingOrders') },
          { value: 'ready', label: t('readyOrders') },
          { value: 'completed', label: t('completedOrders') },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('noWorkOrdersFound')}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orderNumber')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('customer')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('receivedAt')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('dueAt')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orderStatus')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('totalAmount')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setPreviewOrder(order)}
                      className="font-mono text-sm font-medium text-blue-700 hover:underline hover:text-blue-900 text-left"
                    >
                      {order.orderNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(order.receivedAt).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.dueAt ? new Date(order.dueAt).toLocaleDateString('pl-PL') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColor(order.status)}`}
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{t(s.labelKey as any)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.totalAmount ? `${parseFloat(order.totalAmount).toFixed(2)} zł` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEdit(order)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        {t('delete')}
                      </button>
                      <button
                        onClick={() => handleSendReviewSms(order.id)}
                        disabled={sendingSmsId === order.id}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {sendingSmsId === order.id ? t('sending') : t('sendReviewSms')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Modal */}
      {previewOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setPreviewOrder(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <span className="font-mono text-lg font-bold text-blue-700">{previewOrder.orderNumber}</span>
              <button onClick={() => setPreviewOrder(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Klient */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">{t('customer')}</p>
                  <p className="font-medium text-gray-900">{previewOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{previewOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('orderStatus')}</p>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor(previewOrder.status)}`}>
                    {statusLabel(previewOrder.status)}
                  </span>
                </div>
              </div>

              {/* Daty + kwota */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('receivedAt')}</p>
                  <p className="text-gray-900">{new Date(previewOrder.receivedAt).toLocaleDateString('pl-PL')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('dueAt')}</p>
                  <p className="text-gray-900">{previewOrder.dueAt ? new Date(previewOrder.dueAt).toLocaleDateString('pl-PL') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('totalAmount')}</p>
                  <p className="font-semibold text-gray-900">
                    {previewOrder.totalAmount ? `${parseFloat(previewOrder.totalAmount).toFixed(2)} zł` : '—'}
                  </p>
                  {previewOrder.deposit && (
                    <p className="text-xs text-gray-500">{t('deposit')}: {parseFloat(previewOrder.deposit).toFixed(2)} zł</p>
                  )}
                </div>
              </div>

              {/* Pozycje */}
              {previewOrder.items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">{t('lensItems')}</p>
                  <div className="space-y-2">
                    {previewOrder.items.map((item, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <p className="font-medium text-gray-800">{typeLabel(item.type)}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
                          {(item.opSph || item.opCyl) && (
                            <span>OP: {[item.opSph, item.opCyl, item.opAxis && `ax${item.opAxis}`].filter(Boolean).join(' / ')}</span>
                          )}
                          {(item.olSph || item.olCyl) && (
                            <span>OL: {[item.olSph, item.olCyl, item.olAxis && `ax${item.olAxis}`].filter(Boolean).join(' / ')}</span>
                          )}
                          {item.frameModel && <span>{t('frame')}: {item.frameModel}{item.ownFrame ? ` (${t('ownFrame')})` : ''}</span>}
                          {(item.framePrice || item.lensPrice) && (
                            <span>
                              {item.framePrice ? `${t('frame')}: ${item.framePrice} zł` : ''}
                              {item.framePrice && item.lensPrice ? ' | ' : ''}
                              {item.lensPrice ? `${t('lenses')}: ${item.lensPrice} zł` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notatki */}
              {previewOrder.notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('notes')}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{previewOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => { setPreviewOrder(null); openEdit(previewOrder); }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('edit')}
              </button>
              <button
                onClick={() => setPreviewOrder(null)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-white shadow-2xl flex flex-col rounded-xl border border-gray-200 mx-4">
          <div className="p-6 border-b flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold">
              {editingOrder ? t('editWorkOrder') : t('addWorkOrder')}
            </h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
              )}

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customer')} <span className="text-red-500">*</span>
                  </label>

                  {!showNewCustomerForm ? (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={t('searchCustomers')}
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                          autoComplete="off"
                        />
                        {customerSearch && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {customers
                              .filter(c => {
                                const q = customerSearch.toLowerCase();
                                return `${c.name} ${c.surname}`.toLowerCase().includes(q) || c.phone.includes(q);
                              })
                              .slice(0, 5)
                              .map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setForm(prev => ({ ...prev, customerId: c.id }));
                                    setCustomerSearch(`${c.name} ${c.surname} — ${c.phone}`);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{c.name} {c.surname}</div>
                                  <div className="text-sm text-gray-500">{c.phone}</div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {form.customerId && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                          <span className="text-sm text-green-900">
                            {t('selectedCustomer')} {customers.find(c => c.id === form.customerId)?.name} {customers.find(c => c.id === form.customerId)?.surname}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setForm(prev => ({ ...prev, customerId: '' })); setCustomerSearch(''); }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            {t('clear')}
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowNewCustomerForm(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {t('createNewCustomer')}
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900">{t('newCustomer')}</h3>
                        <button
                          type="button"
                          onClick={() => { setShowNewCustomerForm(false); setNewCustomer({ name: '', surname: '', phone: '', email: '', smsConsent: true }); }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">{t('name')} *</label>
                          <input
                            type="text"
                            value={newCustomer.name}
                            onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                            className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">{t('surname')} *</label>
                          <input
                            type="text"
                            value={newCustomer.surname}
                            onChange={e => setNewCustomer(p => ({ ...p, surname: e.target.value }))}
                            className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{t('phone')} *</label>
                        <input
                          type="tel"
                          value={newCustomer.phone}
                          onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}
                          className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900"
                          placeholder="+48 123 456 789"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{t('emailOptional')}</label>
                        <input
                          type="email"
                          value={newCustomer.email}
                          onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                          className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="wo-smsConsent"
                          checked={newCustomer.smsConsent}
                          onChange={e => setNewCustomer(p => ({ ...p, smsConsent: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="wo-smsConsent" className="text-xs text-gray-700">{t('smsConsent')}</label>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('receivedAt')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.receivedAt}
                    onChange={e => setForm(prev => ({ ...prev, receivedAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dueAt')}</label>
                  <input
                    type="date"
                    value={form.dueAt}
                    onChange={e => setForm(prev => ({ ...prev, dueAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('orderStatus')}</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{t(s.labelKey as any)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('totalAmount')} (zł)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.totalAmount}
                    onChange={e => setForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposit')} (zł)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.deposit}
                    onChange={e => setForm(prev => ({ ...prev, deposit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{t('orderItems')}</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t('addItem')}
                  </button>
                </div>

                <div className="space-y-4">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                          <select
                            value={item.type}
                            onChange={e => setItemField(idx, 'type', e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          >
                            {ITEM_TYPES.map(it => (
                              <option key={it.value} value={it.value}>{t(it.labelKey as any)}</option>
                            ))}
                          </select>
                        </div>
                        {form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            {t('removeItem')}
                          </button>
                        )}
                      </div>

                      {/* Prescription table */}
                      {item.type === 'progresywne' ? (
                        <div className="mb-3 space-y-2">
                          {/* Do Dali */}
                          <div className="overflow-x-auto">
                            <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">{t('prescriptionDaliLabel')}</p>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="px-2 py-1 text-left text-xs text-gray-500 w-24"></th>
                                  <th className="px-2 py-1 text-center text-xs text-gray-500">{t('sph')}</th>
                                  <th className="px-2 py-1 text-center text-xs text-gray-500">{t('cyl')}</th>
                                  <th className="px-2 py-1 text-center text-xs text-gray-500">{t('axis')}</th>
                                  <th className="px-2 py-1 text-center text-xs text-gray-500">{t('pd')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">{t('okoPrawe')}</td>
                                  {(['opSph', 'opCyl', 'opAxis', 'opPd'] as const).map(field => (
                                    <td key={field} className="px-1 py-1">
                                      <input type="number" step={field === 'opAxis' ? '1' : '0.25'}
                                        value={(item as any)[field]}
                                        onChange={e => setItemField(idx, field, e.target.value)}
                                        className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm text-gray-900 focus:ring-1 focus:ring-blue-400"
                                        placeholder="—" />
                                    </td>
                                  ))}
                                </tr>
                                <tr>
                                  <td className="px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">{t('okoLewe')}</td>
                                  {(['olSph', 'olCyl', 'olAxis', 'olPd'] as const).map(field => (
                                    <td key={field} className="px-1 py-1">
                                      <input type="number" step={field === 'olAxis' ? '1' : '0.25'}
                                        value={(item as any)[field]}
                                        onChange={e => setItemField(idx, field, e.target.value)}
                                        className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm text-gray-900 focus:ring-1 focus:ring-blue-400"
                                        placeholder="—" />
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          {/* Do Blizy (Add) */}
                          <div className="overflow-x-auto">
                            <p className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">{t('prescriptionNearLabel')}</p>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-green-50">
                                  <th className="px-2 py-1 text-left text-xs text-gray-500 w-24"></th>
                                  <th className="px-2 py-1 text-center text-xs text-gray-500">{t('add')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">{t('okoPrawe')}</td>
                                  <td className="px-1 py-1 w-24">
                                    <input type="number" step="0.25"
                                      value={item.opAdd}
                                      onChange={e => setItemField(idx, 'opAdd', e.target.value)}
                                      className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm text-gray-900 focus:ring-1 focus:ring-green-400"
                                      placeholder="—" />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">{t('okoLewe')}</td>
                                  <td className="px-1 py-1 w-24">
                                    <input type="number" step="0.25"
                                      value={item.olAdd}
                                      onChange={e => setItemField(idx, 'olAdd', e.target.value)}
                                      className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm text-gray-900 focus:ring-1 focus:ring-green-400"
                                      placeholder="—" />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                      <div className="overflow-x-auto mb-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-2 py-1 text-left text-xs text-gray-500 w-24"></th>
                              <th className="px-2 py-1 text-center text-xs text-gray-500">{t('sph')}</th>
                              <th className="px-2 py-1 text-center text-xs text-gray-500">{t('cyl')}</th>
                              <th className="px-2 py-1 text-center text-xs text-gray-500">{t('axis')}</th>
                              <th className="px-2 py-1 text-center text-xs text-gray-500">{t('add')}</th>
                              <th className="px-2 py-1 text-center text-xs text-gray-500">{t('pd')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">{t('okoPrawe')}</td>
                              {(['opSph', 'opCyl', 'opAxis', 'opAdd', 'opPd'] as const).map(field => (
                                <td key={field} className="px-1 py-1">
                                  <input type="number" step={field === 'opAxis' ? '1' : '0.25'}
                                    value={(item as any)[field]}
                                    onChange={e => setItemField(idx, field, e.target.value)}
                                    className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm text-gray-900 focus:ring-1 focus:ring-blue-400"
                                    placeholder="—" />
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">{t('okoLewe')}</td>
                              {(['olSph', 'olCyl', 'olAxis', 'olAdd', 'olPd'] as const).map(field => (
                                <td key={field} className="px-1 py-1">
                                  <input type="number" step={field === 'olAxis' ? '1' : '0.25'}
                                    value={(item as any)[field]}
                                    onChange={e => setItemField(idx, field, e.target.value)}
                                    className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm text-gray-900 focus:ring-1 focus:ring-blue-400"
                                    placeholder="—" />
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      )}

                      {/* Frame + Lens / Contact Lens */}
                      {item.type === 'soczewki_kontaktowe' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">{t('contactLensModel')}</label>
                            <input
                              type="text"
                              value={item.lensType}
                              onChange={e => setItemField(idx, 'lensType', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="np. Acuvue Oasys 1-Day"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">{t('contactLensPrice')} (zł)</label>
                            <input
                              type="number" step="0.01" min="0"
                              value={item.lensPrice}
                              onChange={e => setItemField(idx, 'lensPrice', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">{t('frameModel')}</label>
                            <input
                              type="text"
                              value={item.frameModel}
                              onChange={e => setItemField(idx, 'frameModel', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="np. Ray-Ban RB2140"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">{t('lensType')}</label>
                            <input
                              type="text"
                              value={item.lensType}
                              onChange={e => setItemField(idx, 'lensType', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="np. organiczne AR"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">{t('framePrice')} (zł)</label>
                            <input
                              type="number" step="0.01" min="0"
                              value={item.framePrice}
                              onChange={e => setItemField(idx, 'framePrice', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">{t('lensPrice')} (zł)</label>
                            <input
                              type="number" step="0.01" min="0"
                              value={item.lensPrice}
                              onChange={e => setItemField(idx, 'lensPrice', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <input
                              type="checkbox"
                              id={`ownFrame-${idx}`}
                              checked={item.ownFrame}
                              onChange={e => setItemField(idx, 'ownFrame', e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor={`ownFrame-${idx}`} className="text-sm text-gray-700">{t('ownFrame')}</label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? t('saving') : editingOrder ? t('update') : t('create')}
                </button>
              </div>
            </form>
        </div>
        </div>
      )}
    </div>
  );
}
