-- ============================================
-- MindMap Hub - Save Integrity Hardening
-- Execute AFTER: 1_schema.sql and 2_rls_policies.sql
-- Safe to re-run (idempotent)
-- ============================================

-- Keep UUID generators available on every environment.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------
-- 1) Nodes parent integrity
-- Parent node must belong to the same map and cannot reference itself.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION validate_nodes_parent_map()
RETURNS TRIGGER AS $$
DECLARE
  parent_map UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'Node cannot be its own parent'
      USING ERRCODE = '23514';
  END IF;

  SELECT map_id INTO parent_map
  FROM nodes
  WHERE id = NEW.parent_id;

  IF parent_map IS NULL THEN
    RAISE EXCEPTION 'Parent node does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF parent_map <> NEW.map_id THEN
    RAISE EXCEPTION 'Parent node must belong to the same map'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_nodes_parent_map_trigger ON nodes;
CREATE TRIGGER validate_nodes_parent_map_trigger
  BEFORE INSERT OR UPDATE OF map_id, parent_id ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION validate_nodes_parent_map();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nodes_version_positive'
  ) THEN
    ALTER TABLE nodes
      ADD CONSTRAINT nodes_version_positive CHECK (version > 0);
  END IF;
END $$;

-- --------------------------------------------
-- 2) Node links integrity
-- Both nodes must exist, be distinct, and belong to the same map.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION validate_node_links_map()
RETURNS TRIGGER AS $$
DECLARE
  src_map UUID;
  tgt_map UUID;
BEGIN
  IF NEW.source_node_id = NEW.target_node_id THEN
    RAISE EXCEPTION 'Node link cannot point to itself'
      USING ERRCODE = '23514';
  END IF;

  SELECT map_id INTO src_map FROM nodes WHERE id = NEW.source_node_id;
  SELECT map_id INTO tgt_map FROM nodes WHERE id = NEW.target_node_id;

  IF src_map IS NULL OR tgt_map IS NULL THEN
    RAISE EXCEPTION 'Node link references missing node(s)'
      USING ERRCODE = '23503';
  END IF;

  IF src_map <> tgt_map THEN
    RAISE EXCEPTION 'Node links must connect nodes from the same map'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_node_links_map_trigger ON node_links;
CREATE TRIGGER validate_node_links_map_trigger
  BEFORE INSERT OR UPDATE OF source_node_id, target_node_id ON node_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_node_links_map();

CREATE UNIQUE INDEX IF NOT EXISTS idx_node_links_unique_pair
  ON node_links(source_node_id, target_node_id);

-- --------------------------------------------
-- 3) Edges uniqueness and map freshness
-- --------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_edges_unique_map_source_target
  ON edges(map_id, source_id, target_id);

-- Keep maps.updated_at in sync even when writes happen outside API touch logic.
CREATE OR REPLACE FUNCTION touch_map_from_graph_changes()
RETURNS TRIGGER AS $$
DECLARE
  target_map UUID;
BEGIN
  target_map := COALESCE(NEW.map_id, OLD.map_id);

  IF target_map IS NOT NULL THEN
    UPDATE maps
      SET updated_at = NOW()
      WHERE id = target_map;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_map_from_nodes ON nodes;
CREATE TRIGGER touch_map_from_nodes
  AFTER INSERT OR UPDATE OR DELETE ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION touch_map_from_graph_changes();

DROP TRIGGER IF EXISTS touch_map_from_edges ON edges;
CREATE TRIGGER touch_map_from_edges
  AFTER INSERT OR UPDATE OR DELETE ON edges
  FOR EACH ROW
  EXECUTE FUNCTION touch_map_from_graph_changes();

-- ============================================
-- End
-- ============================================
