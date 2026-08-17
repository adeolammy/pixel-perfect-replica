import { createFileRoute } from '@tanstack/react-router';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const Route = createFileRoute('/api/public/get-pending-jobs')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = process.env['LOCAL_SCRIPT_KEY'];
        if (!key || request.headers.get('x-api-key') !== key) {
          return json({ error: 'Unauthorized' }, 401);
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data, error } = await supabaseAdmin
          .from('jobs')
          .select('*')
          .eq('apply_requested', true)
          .eq('applied', false)
          .order('apply_requested_at', { ascending: true });

        if (error) return json({ error: error.message }, 500);
        return json({ jobs: data ?? [] });
      },
    },
  },
});
