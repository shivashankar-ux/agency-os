const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Simple parser for .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions to safely extract data from Supabase join results (which can be typed as objects or arrays of objects)
function extractName(field, defaultValue = "System") {
  if (!field) return defaultValue;
  if (Array.isArray(field)) {
    return field[0]?.name || defaultValue;
  }
  return field.name || defaultValue;
}

function extractProjectNameFromTask(t) {
  if (!t || !t.projects) return "No Project";
  const proj = Array.isArray(t.projects) ? t.projects[0] : t.projects;
  return proj?.name || "No Project";
}

function extractClientNameFromTask(t) {
  if (!t || !t.projects) return "No Client";
  const proj = Array.isArray(t.projects) ? t.projects[0] : t.projects;
  if (!proj || !proj.clients) return "No Client";
  const client = Array.isArray(proj.clients) ? proj.clients[0] : proj.clients;
  return client?.name || "No Client";
}

async function test() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const [
      clientsRes,
      projectsRes,
      tasksRes,
      profilesRes,
      invoicesRes,
    ] = await Promise.all([
      supabase.from("clients").select("id, name, status, created_at").order("created_at", { ascending: false }),
      supabase.from("projects")
        .select("id, name, status, start_date, end_date, created_at, client_id, clients(name), created_by, profiles(name)")
        .order("created_at", { ascending: false }),
      supabase.from("tasks")
        .select("id, title, status, priority, due_date, assigned_to, project_id, created_at, updated_at, projects(name, client_id, clients(name)), profiles!assigned_to(name)")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name, email, role, job_title, created_at").order("created_at", { ascending: false }),
      supabase.from("invoices").select("id, total_amount, status"),
    ]);

    if (clientsRes.error) console.error("clientsRes Error:", clientsRes.error);
    if (projectsRes.error) console.error("projectsRes Error:", projectsRes.error);
    if (tasksRes.error) console.error("tasksRes Error:", tasksRes.error);
    if (profilesRes.error) console.error("profilesRes Error:", profilesRes.error);
    if (invoicesRes.error) console.error("invoicesRes Error:", invoicesRes.error);

    console.log("All queries executed!");
  } catch (err) {
    console.error("Exception:", err);
  }
}

test();
