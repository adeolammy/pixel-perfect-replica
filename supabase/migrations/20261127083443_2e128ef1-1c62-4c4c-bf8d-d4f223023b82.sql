DROP POLICY "Owner can read jobs" ON public.jobs;
DROP POLICY "Owner can insert jobs" ON public.jobs;
DROP POLICY "Owner can update jobs" ON public.jobs;
DROP POLICY "Owner can delete jobs" ON public.jobs;
CREATE POLICY "Owner can read jobs" ON public.jobs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.dashboard_owners o WHERE o.user_id = auth.uid()));
CREATE POLICY "Owner can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.dashboard_owners o WHERE o.user_id = auth.uid()));
CREATE POLICY "Owner can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.dashboard_owners o WHERE o.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.dashboard_owners o WHERE o.user_id = auth.uid()));
CREATE POLICY "Owner can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.dashboard_owners o WHERE o.user_id = auth.uid()));
DROP FUNCTION public.is_dashboard_owner(uuid);