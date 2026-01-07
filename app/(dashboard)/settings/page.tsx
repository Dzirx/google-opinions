'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Business {
  id: string;
  name: string;
  phone: string | null;
  googleReviewUrl: string;
  smsProvider: string;
  smsConfig: any;
}

export default function SettingsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    googleReviewUrl: '',
    smsProvider: 'smsapi',
    apiKey: '',
    sender: '',
  });

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      const response = await fetch('/api/business');
      const data = await response.json();

      if (data.business) {
        setBusiness(data.business);
        setFormData({
          name: data.business.name,
          phone: data.business.phone || '',
          googleReviewUrl: data.business.googleReviewUrl,
          smsProvider: data.business.smsProvider || 'smsapi',
          apiKey: data.business.smsConfig?.apiKey || '',
          sender: data.business.smsConfig?.sender || '',
        });
      }
    } catch (err) {
      console.error('Error fetching business:', err);
      setError('Failed to load business settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const smsConfig = {
        apiKey: formData.apiKey,
        sender: formData.sender,
      };

      const method = business ? 'PATCH' : 'POST';
      const response = await fetch('/api/business', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          googleReviewUrl: formData.googleReviewUrl,
          smsProvider: formData.smsProvider,
          smsConfig,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save business');
      }

      setBusiness(data.business);
      setSuccess(business ? 'Business updated successfully!' : 'Business created successfully!');

      // Refresh the page data
      await fetchBusiness();
    } catch (err: any) {
      setError(err.message || 'Failed to save business');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/business', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete business');
      }

      setBusiness(null);
      setFormData({
        name: '',
        phone: '',
        googleReviewUrl: '',
        smsProvider: 'smsapi',
        apiKey: '',
        sender: '',
      });
      setSuccess('Business deleted successfully!');
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete business');
      setShowDeleteConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Business Settings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your business information and SMS provider configuration
        </p>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Business Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Business Information
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 bg-white"
                  placeholder="My Salon"
                />
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Business Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 bg-white"
                  placeholder="+48 123 456 789"
                />
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="googleReviewUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  Google Review URL *
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    id="googleReviewUrl"
                    required
                    value={formData.googleReviewUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, googleReviewUrl: e.target.value })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 bg-white"
                    placeholder="https://g.page/r/YOUR_PLACE/review"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    The direct link to your Google Business review page. Customers will be
                    redirected here to leave a review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Provider Configuration */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              SMS Provider Configuration
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="smsProvider" className="block text-sm font-medium text-gray-700">
                  SMS Provider
                </label>
                <select
                  id="smsProvider"
                  value={formData.smsProvider}
                  onChange={(e) => setFormData({ ...formData, smsProvider: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 bg-white"
                >
                  <option value="smsapi" className="text-gray-900">SMSAPI.pl</option>
                  <option value="twilio" className="text-gray-900">Twilio</option>
                  <option value="vonage" className="text-gray-900">Vonage</option>
                  <option value="aws-sns" className="text-gray-900">AWS SNS</option>
                </select>
              </div>

              {formData.smsProvider === 'smsapi' && (
                <>
                  <div className="sm:col-span-4">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                      API Key (Token)
                    </label>
                    <input
                      type="password"
                      id="apiKey"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 bg-white"
                      placeholder="Your SMSAPI.pl token"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="sender" className="block text-sm font-medium text-gray-700">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      id="sender"
                      value={formData.sender}
                      onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 bg-white"
                      placeholder="MySalon"
                      maxLength={11}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      The name that will appear as the SMS sender (max 11 characters)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>
            {business && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Business
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : business ? 'Update Business' : 'Create Business'}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete your business? This action cannot be undone. You can
              only delete a business if it has no appointments.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
