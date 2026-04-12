import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const VALID_METHODS = ['Cash', 'UPI', 'Card', 'Bank'];

// GET: List payments
export async function GET(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('invoice_id');
  const patientId = searchParams.get('patient_id');
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);

  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        invoices:invoice_id (id, invoice_number, total, status),
        patients:patient_id (id, name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (invoiceId) query = query.eq('invoice_id', invoiceId);
    if (patientId) query = query.eq('patient_id', patientId);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json({ data: [] });
      }
      throw error;
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST: Record a payment
export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { invoice_id, patient_id, amount, method, transaction_id, date, notes } = body;

    if (!invoice_id || typeof invoice_id !== 'string') {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    if (!patient_id || typeof patient_id !== 'string') {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json({ error: `Invalid payment method. Must be: ${VALID_METHODS.join(', ')}` }, { status: 400 });
    }

    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total, paid_amount')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create payment
    const record: Record<string, unknown> = {
      invoice_id,
      patient_id,
      amount: paymentAmount,
      method,
      date: date || new Date().toISOString().split('T')[0],
    };
    if (transaction_id) record.transaction_id = transaction_id;
    if (notes) record.notes = notes;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([record])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update invoice paid_amount and status
    const newPaidAmount = (Number(invoice.paid_amount) || 0) + paymentAmount;
    const invoiceTotal = Number(invoice.total) || 0;
    let newStatus = 'Partial';
    if (newPaidAmount >= invoiceTotal) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partial';
    }

    await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice_id);

    return NextResponse.json({ success: true, data: payment });
  } catch {
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}

// DELETE: Remove a payment (and update invoice)
export async function DELETE(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    // Get the payment first
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('invoice_id, amount')
      .eq('id', id)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Delete the payment
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;

    // Update invoice paid_amount
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total, paid_amount')
      .eq('id', payment.invoice_id)
      .single();

    if (invoice) {
      const newPaidAmount = Math.max(0, (Number(invoice.paid_amount) || 0) - (Number(payment.amount) || 0));
      const invoiceTotal = Number(invoice.total) || 0;
      let newStatus = 'Draft';
      if (newPaidAmount >= invoiceTotal && invoiceTotal > 0) {
        newStatus = 'Paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'Partial';
      }

      await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.invoice_id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
