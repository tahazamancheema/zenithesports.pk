-- Atomic Slot Claim RPC Function
-- This function ensures that a team can only register if there are open slots,
-- preventing race conditions when multiple teams try to register at the exact same time.

CREATE OR REPLACE FUNCTION public.register_for_tournament(
  p_tournament_id UUID,
  p_team_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to check counts safely
AS $$
DECLARE
  v_tournament public.tournaments%ROWTYPE;
  v_current_registrations INTEGER;
  v_registration_id UUID;
BEGIN
  -- 1. Lock the tournament row to prevent concurrent modifications
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;

  -- 2. Check if tournament is open for registration
  IF v_tournament.status != 'registration' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament is not open for registration');
  END IF;

  -- 3. Check if team is already registered
  IF EXISTS (
    SELECT 1 FROM public.registrations
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team is already registered for this tournament');
  END IF;

  -- 4. Count current non-rejected registrations
  SELECT COUNT(*) INTO v_current_registrations
  FROM public.registrations
  WHERE tournament_id = p_tournament_id AND status != 'rejected';

  -- 5. Determine registration status (approved vs waitlisted)
  IF v_current_registrations < v_tournament.max_teams THEN
    
    INSERT INTO public.registrations (tournament_id, team_id, status)
    VALUES (p_tournament_id, p_team_id, 'pending')
    RETURNING id INTO v_registration_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'status', 'pending', 
      'registration_id', v_registration_id,
      'message', 'Slot claimed successfully. Pending payment/verification.'
    );
    
  ELSE
    -- Waitlist logic
    INSERT INTO public.registrations (tournament_id, team_id, status)
    VALUES (p_tournament_id, p_team_id, 'waitlisted')
    RETURNING id INTO v_registration_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'status', 'waitlisted', 
      'registration_id', v_registration_id,
      'message', 'Tournament is full. You have been added to the waitlist.'
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
