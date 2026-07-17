import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Initialize regular Supabase client to check request sender's role
    const supabaseUserClient = await createServerClient();

    // Get current user session
    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Check if the user role is Owner
    const { data: profile, error: profileError } = await supabaseUserClient
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "owner") {
      return NextResponse.json({ error: "Only owners can invite team members" }, { status: 403 });
    }

    // Rate limit: 20 invites per day (24 hours)
    const { allowed } = await checkRateLimit(user.id, "invite-team-member", 20, 24);
    if (!allowed) {
      return NextResponse.json({ error: "Too many invites sent today. Please try again tomorrow." }, { status: 429 });
    }

    // Read the request body
    const body = await req.json();
    const { email, name, role, job_title } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Missing required fields: email, name, or role" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Service role key configuration missing on server" }, { status: 500 });
    }

    // Initialize admin Supabase client with Service Role Key
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectToUrl = `${siteUrl}/accept-invite`;

    // Generate signup/invite link via Supabase Auth
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: email,
      options: {
        redirectTo: redirectToUrl,
        data: {
          name: name,
          role: role,
          org_id: profile.org_id,
        },
      },
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    if (!inviteData.user || !inviteData.properties?.action_link) {
      return NextResponse.json({ error: "Failed to generate user invitation link" }, { status: 500 });
    }

    // Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey === "re_your_api_key_here") {
      return NextResponse.json({ error: "Resend API Key configuration is missing. Add RESEND_API_KEY to .env.local" }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    let emailSent = true;
    let emailErrorMsg = null;

    try {
      // Send invitation email via Resend
      // Use onboarding@resend.dev as fallback for development, or a verified custom domain
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      const resendResponse = await resend.emails.send({
        from: `Agency OS Onboarding <${fromEmail}>`,
        to: email,
        subject: `You have been invited to join Agency OS`,
        html: `
          <div style="font-family: sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #1f1f1f; max-width: 500px; margin: 0 auto;">
            <h1 style="color: #6366f1; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">Welcome to the Agency!</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #a3a3a3; margin-bottom: 25px;">
              Hello <strong>${name}</strong>,<br /><br />
              You have been invited to join <strong>Agency OS</strong> as a <strong>${role}</strong>. Set your password to accept the invitation and access your dashboard.
            </p>
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${inviteData.properties.action_link}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block; transition: background-color 0.2s;">
                Set Account Password
              </a>
            </div>
            <p style="font-size: 12px; color: #525252; text-align: center; border-top: 1px solid #1f1f1f; padding-top: 20px; margin-top: 20px;">
              If you did not expect this email, you can safely ignore it.
            </p>
          </div>
        `,
      });

      console.log("Resend API full response:", JSON.stringify(resendResponse, null, 2));

      if (resendResponse.error) {
        console.error("Resend API returned an error:", JSON.stringify(resendResponse.error, null, 2));
        emailSent = false;
        emailErrorMsg = resendResponse.error.message;
      }
    } catch (err: any) {
      console.error("Resend API caught exception:", err);
      emailSent = false;
      emailErrorMsg = err.message || "Unknown mailer error";
    }

    // The database trigger handle_new_user() will have created the profile.
    // Let's update job_title (since trigger doesn't write it) and ensure role is set.
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        job_title: job_title || null,
        role: role, // double-check role is set correctly
      })
      .eq("id", inviteData.user.id);

    if (profileUpdateError) {
      // Log the warning but don't fail the invite since auth user was successfully created
      console.warn("Could not update job title in profiles:", profileUpdateError.message);
    }

    return NextResponse.json({
      success: true,
      user: inviteData.user,
      inviteLink: inviteData.properties.action_link,
      emailSent,
      emailError: emailErrorMsg
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
