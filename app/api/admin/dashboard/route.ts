import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// GET: Dashboard aggregated stats
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const today = new Date().toISOString().split('T')[0];

    // Run all queries in parallel
    // Run appointment queries
    const [
      todayAppointments,
      allAppointments,
      recentAppointments,
    ] = await Promise.all([
      // Today's appointments
      supabase
        .from('appointments')
        .select('id, status, amount')
        .eq('date', today),

      // All appointments (for stats)
      supabase
        .from('appointments')
        .select('date, status, amount, created_at')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true }),

      // Recent 10 appointments
      supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Total patients count (may fail if table doesn't exist yet)
    let totalPatients = { count: 0 as number | null };
    try {
      const result = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true });
      totalPatients = { count: result.error ? 0 : (result.count ?? 0) };
    } catch {
      totalPatients = { count: 0 };
    }

    const todayData = todayAppointments.data || [];
    const todayTotal = todayData.length;
    const todayCheckedIn = todayData.filter(a => a.status === 'Check-in' || a.status === 'Completed').length;
    const todayConfirmed = todayData.filter(a => a.status === 'Confirmed').length;
    const todayPending = todayData.filter(a => a.status === 'Pending').length;
    const todayRevenue = todayData
      .filter(a => a.status === 'Completed')
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const todayCollected = todayData
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    // Last 30 days daily breakdown for chart
    const dailyStats: Record<string, { appointments: number; revenue: number }> = {};
    (allAppointments.data || []).forEach(a => {
      if (!dailyStats[a.date]) dailyStats[a.date] = { appointments: 0, revenue: 0 };
      dailyStats[a.date].appointments++;
      if (a.status === 'Completed') dailyStats[a.date].revenue += Number(a.amount) || 0;
    });

    return NextResponse.json({
      today: {
        total: todayTotal,
        checkedIn: todayCheckedIn,
        confirmed: todayConfirmed,
        pending: todayPending,
        revenue: todayRevenue,
        collected: todayCollected,
      },
      totalPatients: totalPatients.count || 0,
      recentAppointments: recentAppointments.data || [],
      dailyStats,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
