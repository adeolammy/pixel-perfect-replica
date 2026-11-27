CREATE TABLE public.dashboard_owners (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dashboard_owners TO authenticated;
GRANT ALL ON public.dashboard_owners TO service_role;
ALTER TABLE public.dashboard_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can see own row" ON public.dashboard_owners FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_dashboard_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.dashboard_owners WHERE user_id = _user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.is_dashboard_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_dashboard_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_first_dashboard_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  LOCK TABLE public.dashboard_owners IN EXCLUSIVE MODE;
  IF NOT EXISTS (SELECT 1 FROM public.dashboard_owners) THEN
    INSERT INTO public.dashboard_owners (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_first_dashboard_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_claim_owner AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.claim_first_dashboard_owner();

DROP POLICY "Signed-in users can read jobs" ON public.jobs;
DROP POLICY "Signed-in users can insert jobs" ON public.jobs;
DROP POLICY "Signed-in users can update jobs" ON public.jobs;
DROP POLICY "Signed-in users can delete jobs" ON public.jobs;
CREATE POLICY "Owner can read jobs" ON public.jobs FOR SELECT TO authenticated USING (public.is_dashboard_owner(auth.uid()));
CREATE POLICY "Owner can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.is_dashboard_owner(auth.uid()));
CREATE POLICY "Owner can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.is_dashboard_owner(auth.uid())) WITH CHECK (public.is_dashboard_owner(auth.uid()));
CREATE POLICY "Owner can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.is_dashboard_owner(auth.uid()));