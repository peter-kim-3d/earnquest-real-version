-- Trigger to auto-create kindness badge when child receives 5/10/20 cards
CREATE OR REPLACE FUNCTION create_kindness_badge_if_earned()
RETURNS TRIGGER AS $$
DECLARE
  v_card_count INTEGER;
  v_badge_level INTEGER;
  v_cards_required INTEGER;
  v_badge_type TEXT;
  v_family_id UUID;
BEGIN
  -- Count total cards received by this child
  SELECT COUNT(*), family_id
  INTO v_card_count, v_family_id
  FROM kindness_cards
  WHERE to_child_id = NEW.to_child_id
  GROUP BY family_id;

  -- Determine if a badge should be awarded
  v_badge_type := 'kindness'; -- Default badge type

  IF v_card_count >= 20 THEN
    v_badge_level := 3; -- Gold
    v_cards_required := 20;
  ELSIF v_card_count >= 10 THEN
    v_badge_level := 2; -- Silver
    v_cards_required := 10;
  ELSIF v_card_count >= 5 THEN
    v_badge_level := 1; -- Bronze
    v_cards_required := 5;
  ELSE
    RETURN NEW; -- Not enough cards yet
  END IF;

  -- Check if badge already exists
  IF NOT EXISTS (
    SELECT 1 FROM kindness_badges
    WHERE child_id = NEW.to_child_id
      AND badge_type = v_badge_type
      AND level = v_badge_level
  ) THEN
    -- Create new badge
    INSERT INTO kindness_badges (
      child_id,
      family_id,
      badge_type,
      level,
      cards_required,
      earned_at
    ) VALUES (
      NEW.to_child_id,
      v_family_id,
      v_badge_type,
      v_badge_level,
      v_cards_required,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kindness_card_badge_trigger
  AFTER INSERT ON kindness_cards
  FOR EACH ROW
  EXECUTE FUNCTION create_kindness_badge_if_earned();

-- Comments
COMMENT ON FUNCTION create_kindness_badge_if_earned IS 'Auto-creates kindness badges when child receives 5/10/20 cards';
