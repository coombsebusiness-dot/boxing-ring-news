import { redirect } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import StoryEditor from "@/components/admin/stories/StoryEditor";
import { createStory } from "@/app/admin/stories/new/actions";
import { createClient } from "@/lib/supabase/server";

export default async function NewStoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: profile,
  } = await supabase
    .from("newsroom_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) {
    redirect("/");
  }

  const {
    data: desks,
    error,
  } = await supabase
    .from("desks")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/admin"
          className="text-sm font-bold text-black/45 hover:text-black"
        >
          ← Newsroom
        </Link>

        <div className="mt-6 border-b border-black/10 pb-8">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
            Manual Story
          </div>

          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-black">
            Write Story
          </h1>

          <p className="mt-3 text-black/55">
            Create original Boxing Ring News coverage
            directly in the newsroom.
          </p>
        </div>

        <div className="mt-8">
          <StoryEditor
            desks={desks ?? []}
            action={createStory}
          />
        </div>
      </main>
    </div>
  );
}
