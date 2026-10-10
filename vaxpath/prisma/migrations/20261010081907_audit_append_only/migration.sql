-- Audit log and consent history are append-only: block UPDATE and DELETE at the database level.
CREATE OR REPLACE FUNCTION vaxpath_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION vaxpath_block_mutation();

CREATE TRIGGER consents_append_only
  BEFORE UPDATE ON "consents"
  FOR EACH ROW EXECUTE FUNCTION vaxpath_block_mutation();
