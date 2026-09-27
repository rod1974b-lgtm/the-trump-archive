import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { runDailyUpdate } from "@/lib/daily-update.server";

export const Route = createFileRoute("/api/public/hooks/daily-update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const result = await runDailyUpdate();
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
