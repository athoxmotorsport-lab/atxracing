-- Future public Discord notifications link to the new ACC site.
-- Existing messages are intentionally not resent.
CREATE OR REPLACE FUNCTION atx_private.enqueue_discord_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, atx_private, net, vault AS $$
DECLARE
 webhook_url text;
 role_id text;
 body jsonb;
 queued_id bigint;
 target_url text;
BEGIN
 SELECT decrypted_secret INTO webhook_url FROM vault.decrypted_secrets WHERE name='atx_discord_webhook_url';
 SELECT decrypted_secret INTO role_id FROM vault.decrypted_secrets WHERE name='atx_discord_pilot_role_id';
 IF webhook_url IS NULL OR role_id IS NULL THEN RETURN NEW; END IF;
 IF webhook_url !~ '^https://(discord\.com|discordapp\.com)/api/(v[0-9]+/)?webhooks/[0-9]{17,22}/[A-Za-z0-9_-]+$'
    OR role_id !~ '^[0-9]{17,22}$' THEN RETURN NEW; END IF;
 IF NEW.related_link ~ '^course\.html\?event=[a-z0-9]+(-[a-z0-9]+)*$' THEN
  target_url := 'https://athoxmotorsport-lab.github.io/atxracing/fr/acc/course.html?slug='
    || substring(NEW.related_link from '^course\.html\?event=(.+)$');
 ELSIF NEW.related_link = 'classement.html#circuit' THEN
  target_url := 'https://athoxmotorsport-lab.github.io/atxracing/fr/acc/records.html';
 ELSE RETURN NEW; END IF;
 body := jsonb_build_object(
   'username', 'ATX Racing',
   'content', '<@&'||role_id||'> '||E'\n'||'🔔 **'||NEW.title_fr||'**'||E'\n'||NEW.message_fr||E'\n'||target_url,
   'allowed_mentions', jsonb_build_object('parse', jsonb_build_array(), 'roles', jsonb_build_array(role_id))
 );
 SELECT net.http_post(
   url := webhook_url, body := body,
   headers := '{"Content-Type":"application/json"}'::jsonb,
   timeout_milliseconds := 5000
 ) INTO queued_id;
 INSERT INTO atx_private.discord_dispatch(notification_id,request_id) VALUES(NEW.id,queued_id)
 ON CONFLICT(notification_id) DO NOTHING;
 RETURN NEW;
EXCEPTION WHEN OTHERS THEN
 RAISE LOG 'ATX Discord enqueue error for notice %', NEW.id;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION atx_private.enqueue_discord_notification() FROM PUBLIC, anon, authenticated;
