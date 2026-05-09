import { AppShell } from "@/components/shared/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell>
      <Card className="glass-panel shadow-panel">
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Supabase Auth, storage sync, model endpoint routing, and agent policy settings are configured through environment variables.
        </CardContent>
      </Card>
    </AppShell>
  );
}
