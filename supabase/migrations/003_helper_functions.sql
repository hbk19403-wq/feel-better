-- Helper RPC functions used by the backend

CREATE OR REPLACE FUNCTION increment_listener_sessions(listener_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE listeners SET active_session_count = active_session_count + 1 WHERE id = listener_id;
$$;

CREATE OR REPLACE FUNCTION decrement_listener_sessions(listener_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE listeners
  SET active_session_count = GREATEST(0, active_session_count - 1),
      total_sessions = total_sessions + 1
  WHERE id = listener_id;
$$;

CREATE OR REPLACE FUNCTION update_listener_rating(listener_id UUID, new_rating INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  curr_rating NUMERIC;
  curr_count INTEGER;
BEGIN
  SELECT average_rating, rating_count INTO curr_rating, curr_count FROM listeners WHERE id = listener_id;
  UPDATE listeners
  SET average_rating = ROUND((curr_rating * curr_count + new_rating) / (curr_count + 1), 2),
      rating_count = curr_count + 1
  WHERE id = listener_id;
END;
$$;
