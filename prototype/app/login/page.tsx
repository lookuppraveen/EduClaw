"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Building2, Cloud, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = [
  { id: "okta", label: "Okta", description: "Cloud-first SSO", icon: Cloud },
  { id: "azure-ad", label: "Microsoft Entra (Azure AD)", description: "Microsoft 365 institutions", icon: Building2 },
  { id: "shibboleth", label: "Shibboleth / InCommon", description: "Federated higher-ed identity", icon: Network },
];

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="grid min-h-[calc(100vh-30px)] grid-cols-1 lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />
          EduClaw
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">
            AI that helps you learn — not learn for you.
          </h1>
          <p className="text-primary-foreground/80">
            Your personal learning companion is grounded in your courses, respects your privacy,
            and guides you to think — not just to finish.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Phase 1 prototype · Mock auth · No real credentials accepted
        </p>
      </section>

      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in with your institution</CardTitle>
            <CardDescription>Choose your identity provider to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PROVIDERS.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                className="h-auto w-full justify-start gap-3 px-4 py-3 text-left"
                onClick={() => router.push("/demo")}
              >
                <p.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="flex flex-col items-start">
                  <span className="font-medium">{p.label}</span>
                  <span className="text-xs text-muted-foreground">{p.description}</span>
                </span>
              </Button>
            ))}
            <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
              <Badge variant="warning">Mock auth</Badge>
              <Link href="/demo" className="text-accent underline-offset-2 hover:underline">
                Skip to screen index →
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
