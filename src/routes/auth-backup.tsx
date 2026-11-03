import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { homePathFor, primaryRole, rolesQuery, useAuth } from "@/lib/auth";

const searchSchema = z.object({ mode: z.enum(["login", "signup", "forgot"]).optional() });

export const Route = createFileRoute("/auth-backup")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
      { title: "Sign in — SmartBus-AI" },
      { name: "description", content: "Sign in or create your SmartBus-AI account." },
      { property: "og:title", content: "Sign in — SmartBus-AI" },
      { property: "og:description", content: "Access your SmartBus-AI dashboard." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, role, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (!loading && user) navigate({ to: homePathFor(role), replace: true });
  }, [loading, user, role, navigate]);

  const setMode = (m: "login" | "signup" | "forgot") => navigate({ to: "/auth", search: { mode: m }, replace: true });

  async function goHome(userId: string) {
    const roles = await qc.fetchQuery(rolesQuery(userId));
    navigate({ to: homePathFor(primaryRole(roles)), replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = emailSchema.safeParse(form.email);
    if (!email.success) { toast.error(email.error.issues[0]?.message); return; }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for a reset link.");
        return;
      }
      const pw = passwordSchema.safeParse(form.password);
      if (!pw.success) { toast.error(pw.error.issues[0]?.message); return; }
      if (mode === "signup") {
        const name = form.name.trim();
        if (name.length < 2 || name.length > 120) { toast.error("Enter your full name"); return; }
        const { data, error } = await supabase.auth.signUp({
          email: email.data,
          password: pw.data,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created! Check your email to confirm, then sign in.");
          setMode("login");
        } else await goHome(data.session.user.id);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password: pw.data });
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["auth"] });
        await goHome(data.user.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error("Google sign-in failed");
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="bg-gradient-navy hidden flex-col justify-between p-10 text-primary-foreground md:flex">
        <Brand onDark />
        <div>
          <h2 className="text-4xl font-bold">Your Journey.<br /><span className="text-gold">Made Smarter.</span></h2>
          <p className="mt-4 max-w-sm text-primary-foreground/70">
            Smarter campus mobility through real-time tracking and intelligent predictions.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">Driver and admin access is granted by your transport office.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden"><Brand /></div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Student registration" : mode === "forgot" ? "We'll email you a secure link." : "Sign in to continue to your dashboard."}
          </p>

          {mode !== "forgot" && (
            <>
              <Button type="button" variant="outline" className="mt-6 h-11 w-full rounded-xl" onClick={google}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.66 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.56 12 6.56c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 4.03 14.56 3 12 3 6.98 3 2.9 7.03 2.9 12s4.08 9 9.1 9c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.05-.15-1.51z"/></svg>
                Continue with Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" className="h-11 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" className="h-11 rounded-xl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs font-medium text-teal hover:underline">Forgot password?</button>
                  )}
                </div>
                <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="h-11 rounded-xl" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
            )}
            <Button type="submit" variant="gold" className="h-11 w-full rounded-xl" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>New student? <button onClick={() => setMode("signup")} className="font-semibold text-teal hover:underline">Create an account</button></>
            ) : (
              <>Already registered? <button onClick={() => setMode("login")} className="font-semibold text-teal hover:underline">Sign in</button></>
            )}
          </p>
          <p className="mt-3 text-center text-xs"><Link to="/" className="text-muted-foreground hover:text-primary">← Back to home</Link></p>
        </div>
      </div>
    </div>
  );
}
