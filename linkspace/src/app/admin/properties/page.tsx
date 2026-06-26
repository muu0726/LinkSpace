import { createClient } from "@/lib/supabase/server";
import { PropertyListClient } from "./PropertyList";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const supabase = await createClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching properties:", error);
    return <div>物件の取得に失敗しました。</div>;
  }

  // Fetch owners manually since properties.owner_id references auth.users, not public.users directly
  let propertiesWithUsers = properties || [];
  if (properties && properties.length > 0) {
    const ownerIds = [...new Set(properties.map(p => p.owner_id))].filter(Boolean);
    if (ownerIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", ownerIds);

      if (!usersError && usersData) {
        const usersMap = usersData.reduce((acc, curr) => {
          acc[curr.id] = { name: curr.name, email: curr.email };
          return acc;
        }, {} as Record<string, { name: string | null, email: string | null }>);

        propertiesWithUsers = properties.map(p => ({
          ...p,
          users: usersMap[p.owner_id] || { name: "不明", email: "" }
        }));
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">物件管理（検閲）</h1>
        <p className="text-muted-foreground mt-2">
          プラットフォーム上のすべての物件を管理し、不適切なものを強制非公開にすることができます。
        </p>
      </div>

      <PropertyListClient properties={propertiesWithUsers} />
    </div>
  );
}
