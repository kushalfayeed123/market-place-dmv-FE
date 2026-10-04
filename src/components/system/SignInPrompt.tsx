import { LogIn, Lock } from "lucide-react";

export function SignInPrompt({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] p-6 flex flex-col items-center text-center gap-4 max-w-sm">
      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
        <Lock size={20} className="text-[var(--color-primary)]" />
      </div>
      <div>
        <h3 className="font-semibold text-[var(--color-foreground)] mb-1">Sign in required</h3>
        <p className="text-sm text-[var(--color-muted)]">{message}</p>
      </div>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--color-primary-hover)] transition-colors">
        <LogIn size={15} /> Sign in
      </button>
    </div>
  );
}
