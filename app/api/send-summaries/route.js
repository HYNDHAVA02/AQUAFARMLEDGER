import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  // Optional: Secure with CRON_SECRET
  if (
    process.env.CRON_SECRET &&
    req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_PASS;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!GMAIL_USER || !GMAIL_PASS || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });

  // Fetch all users with a non-null email
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .not('email', 'is', null);

  if (userError || !users || users.length === 0) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  let sentCount = 0;
  for (const user of users) {
    // Fetch expenses for the user in the last 7 days, including pond and category names
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select(`
        amount,
        date,
        description,
        pond:pond_id (name),
        category:category_id (name)
      `)
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (expError || !expenses) continue;

    // Generate CSV
    let csv = 'Amount,Date,Description,Pond,Category\n';
    for (const e of expenses) {
      csv += `${e.amount},${e.date},"${e.description || ''}","${e.pond?.name || ''}","${e.category?.name || ''}"\n`;
    }

    // Send email with CSV attachment
    try {
      await transporter.sendMail({
        from: GMAIL_USER,
        to: user.email,
        subject: 'Your Weekly Expense CSV',
        html: '<p>Your weekly expenses are attached as a CSV file.</p>',
        attachments: [
          {
            filename: 'weekly-expenses.csv',
            content: csv
          }
        ]
      });
      sentCount++;
    } catch (err) {
      // Optionally log error
    }
  }

  return NextResponse.json({ ok: true, sent: sentCount });
} 