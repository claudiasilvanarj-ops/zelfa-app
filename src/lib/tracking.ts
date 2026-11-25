import { supabase } from "@/integrations/supabase/client";
import { classifySource } from "@/lib/admin";

const VISITOR_KEY = "zelfa-visitor-id";
const SOURCE_KEY = "zelfa-visit-source";
let appSession: string | null = null;

function visitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, id); }
  return id;
}

/** Records one page view; the origin is decided once per browser visit. */
export function trackPageView(path: string) {
  if (path.startsWith("/admin")) return;
  let source = sessionStorage.getItem(SOURCE_KEY);
  if (!source) {
    source = classifySource(document.referrer, new URLSearchParams(location.search).get("utm_source"));
    sessionStorage.setItem(SOURCE_KEY, source);
  }
  void supabase.rpc("track_visit", { _visitor: visitorId(), _path: path, _source: source }).then(() => {});
}

/** Keeps the signed-in app session alive (who is online, how long they stayed). */
export function appHeartbeat() {
  appSession ??= sessionStorage.getItem("zelfa-app-session") ?? crypto.randomUUID();
  sessionStorage.setItem("zelfa-app-session", appSession);
  void supabase.rpc("app_heartbeat", { _session: appSession }).then(() => {});
}
