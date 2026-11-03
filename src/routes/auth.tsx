
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
import {
  homePathFor,
  primaryRole,
  rolesQuery,
  useAuth,
} from "@/lib/auth";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
      { title: "Sign in — SmartBus-AI" },
      {
        name: "description",
        content: "Sign in or create your SmartBus-AI account.",
      },
      { property: "og:title", content: "Sign in — SmartBus-AI" },
      {
        property: "og:description",
        content: "Access your SmartBus-AI dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(255);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72);

type RouteOption = {
  id: string;
  code: string;
  name: string;
};

type StopOption = {
  id: string;
  name: string;
  sequence: number;
};

function AuthPage() {
  const { mode = "login" } = Route.useSearch();

  const navigate = useNavigate();
  const qc = useQueryClient();

  const { user, role, loading } = useAuth();

  const [busy, setBusy] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<
  "student" | "driver" | "admin" | null
>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    rollNumber: "",
    department: "",
    year: "",
    routeId: "",
    stopId: "",
    password: "",
    confirmPassword: "",
  });

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [stops, setStops] = useState<StopOption[]>([]);

  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingStops, setLoadingStops] = useState(false);

  // Redirect authenticated users to their dashboard.
  useEffect(() => {
    if (!loading && user) {
      navigate({
        to: homePathFor(role),
        replace: true,
      });
    }
  }, [loading, user, role, navigate]);

  // Change authentication mode.
  const setMode = (m: "login" | "signup" | "forgot") => {
    navigate({
      to: "/auth",
      search: { mode: m },
      replace: true,
    });
  };

  // Load active routes for student registration.
  useEffect(() => {
    if (mode !== "signup") return;

    let cancelled = false;

    async function loadRoutes() {
      setLoadingRoutes(true);

      const { data, error } = await supabase
        .from("routes")
        .select("id, code, name")
        .eq("is_active", true)
        .order("name");

      if (cancelled) return;

      if (error) {
        toast.error("Unable to load bus routes.");
        setRoutes([]);
      } else {
        setRoutes(data ?? []);
      }

      setLoadingRoutes(false);
    }

    loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Load pickup stops for the selected route.
  useEffect(() => {
    if (mode !== "signup" || !form.routeId) {
      setStops([]);
      return;
    }

    let cancelled = false;

    async function loadStops() {
      setLoadingStops(true);

      const { data, error } = await supabase
        .from("route_stops")
        .select("id, name, sequence")
        .eq("route_id", form.routeId)
        .order("sequence");

      if (cancelled) return;

      if (error) {
        toast.error("Unable to load pickup locations.");
        setStops([]);
      } else {
        setStops(data ?? []);
      }

      setLoadingStops(false);
    }

    loadStops();

    return () => {
      cancelled = true;
    };
  }, [mode, form.routeId]);

  // Redirect after successful authentication.
  async function goHome(userId: string) {
    await qc.invalidateQueries({
      queryKey: ["auth"],
    });

    const roles = await qc.fetchQuery(rolesQuery(userId));

    navigate({
      to: homePathFor(primaryRole(roles)),
      replace: true,
    });
  }

  // Login, registration and password reset.
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = emailSchema.safeParse(form.email);

    if (!email.success) {
      toast.error(email.error.issues[0]?.message);
      return;
    }

    setBusy(true);

    try {
      // Forgot password.
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.data,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (error) throw error;

        toast.success("Check your email for a password reset link.");
        return;
      }

      // Validate password.
      const pw = passwordSchema.safeParse(form.password);

      if (!pw.success) {
        toast.error(pw.error.issues[0]?.message);
        return;
      }

      // Student registration.
      if (mode === "signup") {
        const name = form.name.trim();
        const phone = form.phone.trim().replace(/\s+/g, "");
        const rollNumber = form.rollNumber.trim();
        const department = form.department.trim();
        const year = Number(form.year);

        if (name.length < 2 || name.length > 120) {
          toast.error("Enter your full name.");
          return;
        }

        if (!/^(?:\+91)?[6-9]\d{9}$/.test(phone)) {
          toast.error("Enter a valid Indian mobile number.");
          return;
        }

        if (rollNumber.length < 1 || rollNumber.length > 50) {
          toast.error("Enter a valid roll number.");
          return;
        }

        if (!department) {
          toast.error("Enter your branch or department.");
          return;
        }

        if (!Number.isInteger(year) || year < 1 || year > 4) {
          toast.error("Select a valid year of study.");
          return;
        }

        if (!form.routeId || !form.stopId) {
          toast.error("Select your bus route and pickup location.");
          return;
        }

        // Confirm that the selected stop belongs to the selected route.
        const selectedStop = stops.find(
          (stop) => stop.id === form.stopId
        );

        if (!selectedStop) {
          toast.error("Please select a valid pickup location.");
          return;
        }

        if (form.password !== form.confirmPassword) {
          toast.error("Passwords do not match.");
          return;
        }

        const normalizedPhone = phone.startsWith("+91")
          ? phone
          : `+91${phone}`;

        const { data, error } = await supabase.auth.signUp({
          email: email.data,
          password: pw.data,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              account_type: "student",
              full_name: name,
              phone: normalizedPhone,
              roll_number: rollNumber,
              department,
              year_of_study: year,
              default_route_id: form.routeId,
              default_stop_id: form.stopId,
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          toast.success(
            "Account created! Check your email to confirm your account."
          );

          setMode("login");
        } else {
          toast.success("Student account created successfully!");

          await goHome(data.session.user.id);
        }
      } else {
        // Existing email and password login.
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.data,
            password: pw.data,
          });

        if (error) throw error;

        await goHome(data.user.id);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  // Existing Google authentication.
  async function google() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });

      if (result.error) {
        toast.error("Google sign-in failed.");
      }
    } catch {
      toast.error("Unable to sign in with Google.");
    }
  }

  const title =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left branding section */}
      <div className="bg-gradient-navy hidden flex-col justify-between p-10 text-primary-foreground md:flex">
        <Brand onDark />

        <div>
          <h2 className="text-4xl font-bold">
            Your Journey.
            <br />
            <span className="text-gold">Made Smarter.</span>
          </h2>

          <p className="mt-4 max-w-sm text-primary-foreground/70">
            Smarter campus mobility through real-time tracking
            and intelligent predictions.
          </p>
        </div>

        <p className="text-xs text-primary-foreground/50">
          Driver and admin access is granted by your transport office.
        </p>
      </div>

      {/* Authentication section */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden">
            <Brand />
          </div>

         
          {mode === "login" && !selectedPortal ? (
  <div className="space-y-6">
    <div className="text-center">
      <h1 className="text-3xl font-bold">Welcome to SmartBus-AI</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Select your account type to continue
      </p>
    </div>

    <div className="grid gap-4">
      <button
        type="button"
        onClick={() => setSelectedPortal("student")}
        className="flex items-center gap-4 rounded-2xl border p-6 text-left transition hover:border-primary hover:bg-primary/5"
      >
        <span className="text-3xl">🎓</span>
        <span>
          <span className="block text-lg font-semibold">Student Login</span>
          <span className="text-sm text-muted-foreground">
            Login or create your student account
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSelectedPortal("driver")}
        className="flex items-center gap-4 rounded-2xl border p-6 text-left transition hover:border-primary hover:bg-primary/5"
      >
        <span className="text-3xl">🚌</span>
        <span>
          <span className="block text-lg font-semibold">Driver Login</span>
          <span className="text-sm text-muted-foreground">
            Login using mobile number and OTP
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSelectedPortal("admin")}
        className="flex items-center gap-4 rounded-2xl border p-6 text-left transition hover:border-primary hover:bg-primary/5"
      >
        <span className="text-3xl">🛡️</span>
        <span>
          <span className="block text-lg font-semibold">Admin Login</span>
          <span className="text-sm text-muted-foreground">
            Restricted administrator access
          </span>
        </span>
      </button>
    </div>
  </div>
) : (
  <>
    <div className="mb-5">
      <button
        type="button"
        onClick={() => {
          setSelectedPortal(null);
          setMode("login");
        }}
        className="text-sm text-teal hover:underline"
      >
        ← Back to account selection
      </button>

      <h1 className="mt-4 text-2xl font-bold">
  {selectedPortal === "student"
    ? mode === "signup"
      ? "Student Registration"
      : title
    : selectedPortal === "driver"
      ? "Driver Login"
      : "Admin Login"}
</h1>
    </div>
  </>
)}

        {selectedPortal !== null && (
  <>
    <h1 className="text-2xl font-bold">{title}</h1>

    <p className="mt-1 text-sm text-muted-foreground">
      {mode === "signup"
        ? "Student registration"
        : mode === "forgot"
          ? "We'll email you a secure reset link."
          : "Sign in to continue to your dashboard."}
    </p>
  </>
)}

          {/* Google sign-in */}
          {selectedPortal === "student" && mode !== "forgot" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-6 h-11 w-full rounded-xl"
                onClick={google}
                disabled={busy}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.66 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.56 12 6.56c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 4.03 14.56 3 12 3 6.98 3 2.9 7.03 2.9 12s4.08 9 9.1 9c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.05-.15-1.51z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

         {selectedPortal !== null && (
<form
  onSubmit={onSubmit}
  className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
>
            {/* Student registration fields */}
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    className="h-11 rounded-xl"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    autoComplete="tel"
                    className="h-11 rounded-xl"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rollNumber">Roll number</Label>
                  <Input
                    id="rollNumber"
                    className="h-11 rounded-xl"
                    value={form.rollNumber}
                    onChange={(e) =>
                      setForm({ ...form, rollNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department">Branch / Department</Label>
                  <Input
                    id="department"
                    placeholder="Example: CSE AIML"
                    className="h-11 rounded-xl"
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="year">Year of study</Label>
                  <select
                    id="year"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={form.year}
                    onChange={(e) =>
                      setForm({ ...form, year: e.target.value })
                    }
                    required
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="route">Bus route</Label>
                  <select
                    id="route"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={form.routeId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        routeId: e.target.value,
                        stopId: "",
                      })
                    }
                    required
                    disabled={loadingRoutes}
                  >
                    <option value="">
                      {loadingRoutes
                        ? "Loading routes..."
                        : "Select your bus route"}
                    </option>

                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.code} - {route.name}
                      </option>
                    ))}
                  </select>

                  {!loadingRoutes && routes.length === 0 && (
                    <p className="text-xs text-destructive">
                      No active routes available. Contact the transport office.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stop">Pickup location</Label>
                  <select
                    id="stop"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={form.stopId}
                    onChange={(e) =>
                      setForm({ ...form, stopId: e.target.value })
                    }
                    required
                    disabled={!form.routeId || loadingStops}
                  >
                    <option value="">
                      {!form.routeId
                        ? "Select a route first"
                        : loadingStops
                          ? "Loading pickup locations..."
                          : "Select pickup location"}
                    </option>

                    {stops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.sequence}. {stop.name}
                      </option>
                    ))}
                  </select>

                  {form.routeId &&
                    !loadingStops &&
                    stops.length === 0 && (
                      <p className="text-xs text-destructive">
                        No pickup locations available for this route.
                      </p>
                    )}
                </div>
              </>
            )}

            Email
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className="h-11 rounded-xl"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            {/* Password */}
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>

                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs font-medium text-teal hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  placeholder="Minimum 8 characters"
                  className="h-11 rounded-xl"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Confirm password */}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">
                  Confirm password
                </Label>

                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="h-11 rounded-xl"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="gold"
              className="h-11 w-full rounded-xl"
              disabled={busy}
            >
              {busy && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {mode === "signup"
                ? "Create student account"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in"}
            </Button>
          </form>
          )}

          {/* Switch authentication mode */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                New student?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-semibold text-teal hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-teal hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-3 text-center text-xs">
            <Link
              to="/"
              className="text-muted-foreground hover:text-primary"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
