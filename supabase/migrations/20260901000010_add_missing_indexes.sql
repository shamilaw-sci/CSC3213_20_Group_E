-- Add missing indexes to improve query performance

-- 1. Index on buyer_id in property_views
CREATE INDEX IF NOT EXISTS idx_property_views_buyer_id ON property_views (buyer_id);

-- 2. Index on conversation_id in messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);

-- 3. Geographic index on boundary in properties
CREATE INDEX IF NOT EXISTS idx_properties_boundary ON properties USING GIST (boundary);
