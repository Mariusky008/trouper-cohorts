
import { createAdminClient } from "./src/lib/supabase/admin";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Mock createAdminClient locally if needed or just use the logic directly
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkActivity() {
  console.log("Checking Network Activity...");

  // 1. Raw Opportunities
  const { data: rawOps, error: rawOpError } = await supabase
    .from("network_opportunities")
    .select("*")
    .limit(5);

  if (rawOpError) console.error("Raw Op Error:", rawOpError);
  console.log("Raw Opportunities:", rawOps?.length);
  if (rawOps && rawOps.length > 0) console.log(rawOps[0]);

  // 2. Raw Matches (All Statuses)
  const { data: rawMatches, error: rawMatchError } = await supabase
    .from("network_matches")
    .select("status")
    .limit(10);

  if (rawMatchError) console.error("Raw Match Error:", rawMatchError);
  console.log("Raw Matches Statuses:", rawMatches);
}

checkActivity();
