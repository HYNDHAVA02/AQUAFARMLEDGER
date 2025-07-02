import 'dotenv/config';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Debug: Print SUPABASE_URL to verify .env loading
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check for missing env variables
if (!GMAIL_USER || !GMAIL_PASS || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('One or more required environment variables are missing. Please check your .env file.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

async function sendSummariesToAllUsers() {
  // Fetch all users with a non-null email
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .not('email', 'is', null);

  if (userError || !users || users.length === 0) {
    console.error('Failed to fetch users:', userError);
    return;
  }

  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

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

    if (expError || !expenses) {
      console.error(`Failed to fetch expenses for user ${user.id}:`, expError);
      continue;
    }

    // Debug: Print fetched expenses
    console.log(`Fetched expenses for ${user.email}:`, expenses);

    // Generate CSV with all required fields
    let csv = 'Amount,Date,Description,Pond,Category\n';
    for (const e of expenses) {
      const row = `${e.amount},${e.date},"${e.description || ''}","${e.pond?.name || ''}","${e.category?.name || ''}"\n`;
      // Debug: Print each CSV row
      console.log('CSV row:', row.trim());
      csv += row;
    }

    // Send email with CSV attachment
    try {
      const info = await transporter.sendMail({
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
      console.log(`Email sent to ${user.email}:`, info.response);
    } catch (err) {
      console.error(`Failed to send email to ${user.email}:`, err);
    }
  }
}

sendSummariesToAllUsers(); 