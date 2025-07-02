import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Get environment variables
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("URL");
  const supabaseServiceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!resendApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing environment variables", { status: 500 });
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Get all users with emails
  const { data: users, error: userError } = await supabase
    .from("profiles")
    .select("id, email")
    .not("email", "is", null);

  if (userError || !users) {
    return new Response("Failed to fetch users", { status: 500 });
  }

  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  const startDateStr = startDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const endDateStr = endDate.toISOString().slice(0, 10);

  // For each user, fetch expenses and send email
  for (const user of users) {
    if (!user.email) continue;
    // Fetch expenses for the user in the last 7 days
    const { data: expenses, error: expError } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (expError || !expenses) continue;

    // Calculate total
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Compose email
    const subject = "Your Weekly Expense Summary";
    const html = `
      <h2>Weekly Expense Summary</h2>
      <p>Total expenses from ${startDate.toDateString()} to ${endDate.toDateString()}: <strong>₹${total.toLocaleString()}</strong></p>
    `;

    // Send email via Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "hyndhavavegesna29@gmail.com", // Replace with your verified sender
        to: user.email,
        subject,
        html
      })
    });
  }

  return new Response("Expense summary emails sent!");
}); 