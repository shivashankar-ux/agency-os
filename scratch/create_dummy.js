const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local file");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function main() {
  const email = "dummy@thestorybuilder.in";
  const password = "Password123!";
  const name = "Dummy Teammate";
  const role = "manager";

  console.log(`Creating dummy user: ${email}...`);

  // First, check if user exists. If so, delete it so we start fresh.
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }

  const existingUser = usersData.users.find(u => u.email === email);
  if (existingUser) {
    console.log("User already exists. Deleting first to reset...");
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error("Error deleting existing user:", deleteError.message);
      return;
    }
  }

  // Create user
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role
    }
  });

  if (createError) {
    console.error("Error creating user:", createError.message);
    return;
  }

  console.log("User created successfully in auth.users!");
  console.log("User ID:", createData.user.id);

  // Trigger handle_new_user should have inserted into profiles.
  // Let's verify and update job title/is_active to make sure it's active.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", createData.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching created profile:", profileError.message);
    return;
  }

  // Update job title and role
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ job_title: "Marketing Lead", role: role, is_active: true })
    .eq("id", createData.user.id);

  if (updateError) {
    console.error("Error updating profile details:", updateError.message);
    return;
  }

  console.log("Profile verified and updated in public.profiles table!");
  console.log("\nSuccess!");
  console.log("-----------------------------------------");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     ${role}`);
  console.log("-----------------------------------------");
}

main();
