import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-8 text-white">
        <div className="text-3xl font-black tracking-[-0.04em]">
          INFORMANT <span className="text-red-600">WIRE</span>
        </div>

        <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white/40">
          Newsroom Login
        </div>

        <p className="mt-6 text-sm leading-6 text-white/55">
          Sign in to access the private Informant Wire editorial newsroom.
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
