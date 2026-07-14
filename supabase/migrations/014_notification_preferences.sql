-- Notification Preferences Table
-- Stores user preferences for which events trigger push notifications

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- Task events
    task_assigned BOOLEAN DEFAULT true,
    task_completed BOOLEAN DEFAULT false,
    task_overdue BOOLEAN DEFAULT true,
    task_due_soon BOOLEAN DEFAULT true, -- 24h before due
    task_comment BOOLEAN DEFAULT true,
    task_mentioned BOOLEAN DEFAULT true,
    -- Project events
    project_updated BOOLEAN DEFAULT false,
    project_deadline BOOLEAN DEFAULT true,
    -- Team events
    team_member_added BOOLEAN DEFAULT false,
    team_mention BOOLEAN DEFAULT true,
    -- Finance events
    invoice_paid BOOLEAN DEFAULT true,
    invoice_overdue BOOLEAN DEFAULT true,
    payment_received BOOLEAN DEFAULT true,
    -- General
    siren_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME, -- e.g., '22:00'
    quiet_hours_end TIME,   -- e.g., '08:00'
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all preferences
CREATE POLICY "Admins can view all preferences" ON notification_preferences
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Admins can manage all preferences" ON notification_preferences
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user wants notification for event type
CREATE OR REPLACE FUNCTION should_send_notification(
    p_user_id UUID,
    p_event_type TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_prefs notification_preferences%ROWTYPE;
    v_now TIME;
    v_tz TEXT;
BEGIN
    -- Get user preferences
    SELECT * INTO v_prefs FROM notification_preferences WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN true; -- Default to enabled if no prefs
    END IF;
    
    -- Check siren enabled
    IF NOT v_prefs.siren_enabled THEN
        RETURN false;
    END IF;
    
    -- Check quiet hours
    IF v_prefs.quiet_hours_start IS NOT NULL AND v_prefs.quiet_hours_end IS NOT NULL THEN
        v_tz := COALESCE(v_prefs.timezone, 'UTC');
        v_now := (NOW() AT TIME ZONE v_tz)::TIME;
        
        IF v_prefs.quiet_hours_start > v_prefs.quiet_hours_end THEN
            -- Overnight quiet hours (e.g., 22:00 - 08:00)
            IF v_now >= v_prefs.quiet_hours_start OR v_now <= v_prefs.quiet_hours_end THEN
                RETURN false;
            END IF;
        ELSE
            -- Same-day quiet hours
            IF v_now >= v_prefs.quiet_hours_start AND v_now <= v_prefs.quiet_hours_end THEN
                RETURN false;
            END IF;
        END IF;
    END IF;
    
    -- Check event-specific preference
    CASE p_event_type
        WHEN 'task_assigned' THEN RETURN v_prefs.task_assigned;
        WHEN 'task_completed' THEN RETURN v_prefs.task_completed;
        WHEN 'task_overdue' THEN RETURN v_prefs.task_overdue;
        WHEN 'task_due_soon' THEN RETURN v_prefs.task_due_soon;
        WHEN 'task_comment' THEN RETURN v_prefs.task_comment;
        WHEN 'task_mentioned' THEN RETURN v_prefs.task_mentioned;
        WHEN 'project_updated' THEN RETURN v_prefs.project_updated;
        WHEN 'project_deadline' THEN RETURN v_prefs.project_deadline;
        WHEN 'team_member_added' THEN RETURN v_prefs.team_member_added;
        WHEN 'team_mention' THEN RETURN v_prefs.team_mention;
        WHEN 'invoice_paid' THEN RETURN v_prefs.invoice_paid;
        WHEN 'invoice_overdue' THEN RETURN v_prefs.invoice_overdue;
        WHEN 'payment_received' THEN RETURN v_prefs.payment_received;
        ELSE RETURN true;
    END CASE;
END;
$$;

-- Function to get users who should be notified for a task event
CREATE OR REPLACE FUNCTION get_notifiable_users_for_task(
    p_task_id UUID,
    p_event_type TEXT
) RETURNS SETOF UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_task RECORD;
    v_assignee UUID;
    v_project_members UUID[];
BEGIN
    -- Get task details
    SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
    IF NOT FOUND THEN RETURN; END IF;
    
    v_assignee := v_task.assignee_id;
    
    -- Get project members
    SELECT array_agg(p.id) INTO v_project_members
    FROM profiles p
    JOIN project_members pm ON p.id = pm.user_id
    WHERE pm.project_id = v_task.project_id;
    
    -- Return users based on event type
    CASE p_event_type
        WHEN 'task_assigned' THEN
            IF v_assignee IS NOT NULL AND should_send_notification(v_assignee, 'task_assigned') THEN
                RETURN NEXT v_assignee;
            END IF;
        WHEN 'task_completed' THEN
            -- Notify creator and assignee
            IF v_task.created_by IS NOT NULL AND should_send_notification(v_task.created_by, 'task_completed') THEN
                RETURN NEXT v_task.created_by;
            END IF;
            IF v_assignee IS NOT NULL AND v_assignee != v_task.created_by AND should_send_notification(v_assignee, 'task_completed') THEN
                RETURN NEXT v_assignee;
            END IF;
        WHEN 'task_overdue', 'task_due_soon' THEN
            IF v_assignee IS NOT NULL AND should_send_notification(v_assignee, p_event_type) THEN
                RETURN NEXT v_assignee;
            END IF;
        WHEN 'task_comment', 'task_mentioned' THEN
            -- Notify all project members except commenter (handled in caller)
            FOR i IN 1..array_length(v_project_members, 1) LOOP
                IF should_send_notification(v_project_members[i], p_event_type) THEN
                    RETURN NEXT v_project_members[i];
                END IF;
            END LOOP;
    END CASE;
    
    RETURN;
END;
$$;