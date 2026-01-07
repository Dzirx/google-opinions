'use client';

import { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  scheduledSmsDate: string;
  smsSentAt: string | null;
  smsStatus: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    appointmentDate: '',
    scheduledSmsDate: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // CSV import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }

      setAppointments(data.appointments || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      setShowAddModal(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        appointmentDate: '',
        scheduledSmsDate: '',
      });
      fetchAppointments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    setFormError('');
    setFormLoading(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAppointment.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment');
      }

      setEditingAppointment(null);
      setFormData({
        customerName: '',
        customerPhone: '',
        appointmentDate: '',
        scheduledSmsDate: '',
      });
      fetchAppointments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update appointment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete appointment');
      }

      fetchAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete appointment');
    }
  };

  const handleSendSms = async (appointmentId: string) => {
    if (!confirm('Send SMS to customer now?')) return;

    try {
      const response = await fetch('/api/appointments/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      alert('SMS sent successfully!');
      fetchAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send SMS');
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim());
      const csvData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        csvData.push(row);
      }

      // Send to API
      const response = await fetch('/api/appointments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData }),
      });

      const data = await response.json();
      setImportResult(data);

      if (data.summary.successful > 0) {
        fetchAppointments();
      }
    } catch (err) {
      setImportResult({
        error: err instanceof Error ? err.message : 'Failed to import CSV',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      appointmentDate: appointment.appointmentDate.split('T')[0] + 'T' + appointment.appointmentDate.split('T')[1].substring(0, 5),
      scheduledSmsDate: appointment.scheduledSmsDate.split('T')[0] + 'T' + appointment.scheduledSmsDate.split('T')[1].substring(0, 5),
    });
  };

  const exportToCSV = () => {
    if (filteredAppointments.length === 0) {
      alert('No appointments to export');
      return;
    }

    // CSV headers
    const headers = ['Customer Name', 'Phone', 'Appointment Date', 'Scheduled SMS', 'SMS Status', 'SMS Sent At'];

    // CSV rows
    const rows = filteredAppointments.map(appt => [
      appt.customerName,
      appt.customerPhone,
      new Date(appt.appointmentDate).toLocaleString(),
      new Date(appt.scheduledSmsDate).toLocaleString(),
      appt.smsStatus,
      appt.smsSentAt ? new Date(appt.smsSentAt).toLocaleString() : 'N/A'
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAppointments = appointments.filter(appt => {
    if (filter === 'all') return true;
    return appt.smsStatus === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your appointments and send review requests
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            disabled={filteredAppointments.length === 0}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Appointment
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          All ({appointments.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Pending ({appointments.filter(a => a.smsStatus === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('sent')}
          className={`px-4 py-2 rounded-md ${filter === 'sent' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Sent ({appointments.filter(a => a.smsStatus === 'sent').length})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 rounded-md ${filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Failed ({appointments.filter(a => a.smsStatus === 'failed').length})
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No appointments found. Create your first appointment to get started!
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appointment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMS Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appt) => (
                <tr key={appt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {appt.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appt.customerPhone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(appt.appointmentDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(appt.scheduledSmsDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appt.smsStatus)}`}>
                      {appt.smsStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {appt.smsStatus === 'pending' && (
                        <button
                          onClick={() => handleSendSms(appt.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Send SMS
                        </button>
                      )}
                      {appt.smsStatus !== 'sent' && (
                        <button
                          onClick={() => openEditModal(appt)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingAppointment) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingAppointment ? 'Edit Appointment' : 'Add Appointment'}
            </h2>
            <form onSubmit={editingAppointment ? handleUpdateAppointment : handleAddAppointment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+48123456789"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                  <input
                    type="datetime-local"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scheduled SMS Date</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledSmsDate}
                    onChange={(e) => setFormData({ ...formData, scheduledSmsDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAppointment(null);
                    setFormData({
                      customerName: '',
                      customerPhone: '',
                      appointmentDate: '',
                      scheduledSmsDate: '',
                    });
                    setFormError('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingAppointment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Import Appointments from CSV</h2>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 font-medium">CSV Format:</p>
              <p className="text-sm text-blue-700 mt-1">
                customerName,customerPhone,appointmentDate,scheduledSmsDate
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Example: John Doe,+48123456789,2026-01-15T14:00,2026-01-14T10:00
              </p>
            </div>

            <form onSubmit={handleCsvUpload}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {importResult && (
                <div className={`mt-4 p-4 rounded ${importResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  {importResult.error ? (
                    <p className="text-red-700">{importResult.error}</p>
                  ) : (
                    <>
                      <p className="text-green-800 font-medium">{importResult.message}</p>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Total: {importResult.summary.total}</p>
                        <p>Successful: {importResult.summary.successful}</p>
                        <p>Failed: {importResult.summary.failed}</p>
                      </div>
                      {importResult.errors.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto">
                          <p className="text-sm font-medium text-red-800">Errors:</p>
                          {importResult.errors.map((err: any, idx: number) => (
                            <p key={idx} className="text-xs text-red-700">
                              Row {err.row}: {err.error}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setImportResult(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || importLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {importLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
