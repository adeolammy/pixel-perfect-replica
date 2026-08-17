import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const schema = z.object({ id: z.string().uuid() });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const Route = createFileRoute('/api/public/mark-job-applied')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env['LOCAL_SCRIPT_KEY'];
        if (!key || request.headers.get('x-api-key') !== key) {
          return json({ error: 'Unauthorized' }, 401);
        }

        let parsed;
        try {
          parsed = schema.parse(await request.json());
        } catch {
          return json({ error: 'Invalid body: expected { id: uuid }' }, 400);
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data, error } = await supabaseAdmin
          .from('jobs')
          .update({ applied: true, applied_at: new Date().toISOString() })
          .eq('id', parsed.id)
          .select('id, applied, applied_at')
          .maybeSingle();

        if (error) return json({ error: error.message }, 500);
        if (!data) return json({ error: 'Job not found' }, 404);
        return json({ job: data });
      },
    },
  },
});
