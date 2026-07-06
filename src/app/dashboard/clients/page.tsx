import { createClient } from "@/lib/supabase/server";
import ClientsTable from "./ClientsTable";
import AddClientButton from "./AddClientButton";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {clients?.length ?? 0} client{clients?.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddClientButton />
      </div>

      <ClientsTable clients={clients ?? []} />
    </div>
  );
}
