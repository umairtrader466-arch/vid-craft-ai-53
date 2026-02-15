
-- Auto-assign admin role to specific email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign admin role for specific email
  IF NEW.email = 'umairislam6213022@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  -- Always assign user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  -- Create user limits
  INSERT INTO public.user_limits (user_id, monthly_video_limit)
    VALUES (NEW.id, COALESCE(
      (SELECT (value#>>'{}')::int FROM public.app_settings WHERE key = 'default_monthly_video_limit'),
      10
    ));
  RETURN NEW;
END;
$$;
