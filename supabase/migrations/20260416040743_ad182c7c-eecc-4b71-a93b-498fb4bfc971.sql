
-- Table: approval levels per leave type
CREATE TABLE public.approval_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  approval_level integer NOT NULL,
  approver_role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(leave_type_id, approval_level)
);

ALTER TABLE public.approval_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approval_config" ON public.approval_config FOR SELECT USING (true);
CREATE POLICY "Anyone can insert approval_config" ON public.approval_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update approval_config" ON public.approval_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete approval_config" ON public.approval_config FOR DELETE USING (true);

-- Allow updates on leave_types for QTHT
CREATE POLICY "Anyone can update leave_types" ON public.leave_types FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert leave_types" ON public.leave_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete leave_types" ON public.leave_types FOR DELETE USING (true);

-- Allow updates on leave_config for QTHT
CREATE POLICY "Anyone can update leave_config" ON public.leave_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert leave_config" ON public.leave_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete leave_config" ON public.leave_config FOR DELETE USING (true);

-- Seed default leave cycle config
INSERT INTO public.leave_config (config_key, config_value, description) VALUES
  ('leave_cycle', 'yearly', 'Chu kỳ tính phép: yearly hoặc monthly')
ON CONFLICT DO NOTHING;

-- Seed default approval config for all leave types
INSERT INTO public.approval_config (leave_type_id, approval_level, approver_role)
SELECT lt.id, 1, 'LD.PCM'::public.app_role FROM public.leave_types lt
UNION ALL
SELECT lt.id, 2, 'GD.PGD'::public.app_role FROM public.leave_types lt;
