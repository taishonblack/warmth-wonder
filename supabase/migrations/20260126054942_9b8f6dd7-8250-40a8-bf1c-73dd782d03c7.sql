-- Drop the overly permissive notifications INSERT policy
DROP POLICY "System can create notifications" ON public.notifications;

-- Create a more restrictive policy: authenticated users can create notifications for other users
-- This is used when a user follows someone or gives thanks - they create a notification for the recipient
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() != user_id);