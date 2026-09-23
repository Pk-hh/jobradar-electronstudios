const API_BASE = '/api';

export function getGuestUserId() {
  let guestId = localStorage.getItem('guest_user_id');
  if (!guestId) {
    guestId = 'usr_guest_' + Date.now() + Math.random().toString(36).substring(2, 6);
    localStorage.setItem('guest_user_id', guestId);
  }
  return guestId;
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const guestId = getGuestUserId();
  const headers = { 'x-user-id': guestId };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'An unexpected error occurred.');
  }

  return data;
}

export const jobApi = {
  getJobs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/jobs?${query.toString()}`);
  },

  getJobDetails: (id) => request(`/jobs/${id}`),

  getRecommendations: () => request('/jobs/recommended'),

  toggleSave: (id) => request(`/jobs/${id}/save`, { method: 'POST' }),

  getSavedJobs: () => request('/jobs/user/saved'),

  logApplyClick: (id) => request(`/jobs/${id}/apply-click`, { method: 'POST' }),

  trackApplication: (id, status, notes = '') =>
    request(`/jobs/${id}/track-application`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    }),

  getUserApplications: () => request('/jobs/user/applications'),

  reportJob: (id, reason, details) =>
    request(`/jobs/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details })
    })
};

export const authApi = {
  getProfile: () => request('/auth/me'),

  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
};

export const adminApi = {
  getStats: () => request('/admin/stats'),
  getAdminJobs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/jobs?${query}`);
  },
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  createJob: (jobData) =>
    request('/admin/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    }),
  updateJob: (id, jobData) =>
    request(`/admin/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData)
    }),
  toggleVerify: (id) =>
    request(`/admin/jobs/${id}/verify`, { method: 'PATCH' }),
  updateStatus: (id, status) =>
    request(`/admin/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  deleteJob: (id) =>
    request(`/admin/jobs/${id}`, { method: 'DELETE' }),
  getReports: () => request('/admin/reports'),
  updateReportStatus: (id, status) =>
    request(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  broadcastNotification: (notifData) =>
    request('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(notifData)
    })
};

export const notificationApi = {
  getNotifications: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' })
};
