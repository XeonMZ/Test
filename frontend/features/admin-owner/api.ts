import { http } from '@/services/http';



/** 30-day operational summary powering the admin dashboard metrics. */
export async function fetchAdminOwnerSummary() { return (await http.get('/admin/reports')).data; }

/** Most recent audit-trail entries for the dashboard activity feed. */
export async function fetchRecentActivity() { return (await http.get('/admin/reports/activity-logs', { params: { per_page: 6 } })).data; }
