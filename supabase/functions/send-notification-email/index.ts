// Supabase Edge Function: Send Notification Emails
// Handles sending emails for various notification types

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

interface NotificationPayload {
  notification_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  project_id: string | null;
  metadata: Record<string, any>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get notification data from request
    const payload: NotificationPayload = await req.json();

    console.log("Processing notification:", payload.notification_id);

    // Get user email and preferences
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      payload.user_id
    );

    if (userError || !userData?.user?.email) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = userData.user.email;

    // Check if user has email notifications enabled
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_enabled, email_frequency")
      .eq("user_id", payload.user_id)
      .single();

    if (!prefs?.email_enabled) {
      console.log("Email notifications disabled for user:", payload.user_id);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Email notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email template
    const emailTemplate = generateEmailTemplate(payload);

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Project Tracker <notifications@yourdomain.com>", // Change this!
        to: [userEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailResult.id);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateEmailTemplate(payload: NotificationPayload): EmailTemplate {
  const { type, title, message, link, metadata } = payload;

  const actionUrl = link ? `${APP_URL}${link}` : `${APP_URL}/notifications`;
  const unsubscribeUrl = `${APP_URL}/settings/notifications`;

  // Icon/emoji based on notification type
  const icons: Record<string, string> = {
    project_status_changed: "📁",
    milestone_completed: "✅",
    budget_warning: "⚠️",
    budget_exceeded: "🚨",
    new_comment: "💬",
    comment_mention: "@",
    project_archived: "📦",
  };

  const icon = icons[type] || "🔔";

  // HTML email template
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 32px;
          }
          .icon {
            font-size: 48px;
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 16px;
            text-align: center;
          }
          .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 24px;
            text-align: center;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: #ffffff !important;
            padding: 12px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            text-align: center;
            margin: 20px auto;
            display: block;
            width: fit-content;
          }
          .metadata {
            background: #f9fafb;
            border-radius: 6px;
            padding: 16px;
            margin-top: 24px;
            font-size: 14px;
            color: #6b7280;
          }
          .footer {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">${icon}</div>
          <h1 class="title">${title}</h1>
          <p class="message">${message}</p>
          
          <a href="${actionUrl}" class="button">View Details</a>
          
          ${Object.keys(metadata).length > 0 ? `
            <div class="metadata">
              ${Object.entries(metadata)
                .map(([key, value]) => `<div><strong>${formatKey(key)}:</strong> ${value}</div>`)
                .join("")}
            </div>
          ` : ""}
        </div>
        
        <div class="footer">
          <p>You're receiving this email because you have notifications enabled.</p>
          <p>
            <a href="${unsubscribeUrl}">Manage notification preferences</a> | 
            <a href="${APP_URL}">Go to app</a>
          </p>
        </div>
      </body>
    </html>
  `;

  // Plain text version
  const text = `
${icon} ${title}

${message}

View details: ${actionUrl}

${Object.entries(metadata)
  .map(([key, value]) => `${formatKey(key)}: ${value}`)
  .join("\n")}

---
You're receiving this email because you have notifications enabled.
Manage preferences: ${unsubscribeUrl}
  `.trim();

  return {
    subject: `${icon} ${title}`,
    html,
    text,
  };
}

function formatKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
