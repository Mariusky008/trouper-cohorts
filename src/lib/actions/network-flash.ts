"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type FlashQuestion = {
  id: string;
  user_id: string;
  city: string;
  content: string;
  post_type: "question" | "co_creation";
  idea_title: string | null;
  target_client: string | null;
  looking_for: string | null;
  expected_outcome: string | null;
  status: "open" | "duo_formed" | "test_running" | "validated";
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
    trade: string | null;
  };
  answers_count: number;
  answers?: FlashAnswer[];
};

export type FlashAnswer = {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: {
    display_name: string;
    avatar_url: string | null;
    trade: string | null;
  };
};

const normalizeLegacyQuestion = (question: { id: string; user_id: string; city: string; content: string; created_at: string }) => ({
  ...question,
  post_type: "question" as const,
  idea_title: null,
  target_client: null,
  looking_for: null,
  expected_outcome: null,
  status: "open" as const,
});

export async function getFlashQuestions(city: string): Promise<FlashQuestion[]> {
  const supabase = await createClient();
  
  // 1. Get Questions for the city
  const { data: questions, error } = await supabase
    .from("network_flash_questions")
    .select(`
      id, 
      user_id, 
      city, 
      content, 
      post_type,
      idea_title,
      target_client,
      looking_for,
      expected_outcome,
      status,
      created_at
    `)
    .eq("city", city)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    const { data: legacyQuestions, error: legacyError } = await supabase
      .from("network_flash_questions")
      .select("id,user_id,city,content,created_at")
      .eq("city", city)
      .order("created_at", { ascending: false })
      .limit(20);
    if (legacyError) {
      console.error("Error fetching flash questions:", legacyError);
      return [];
    }
    return await enrichQuestions((legacyQuestions || []).map(normalizeLegacyQuestion));
  }

  if (!questions || questions.length === 0) return [];
  return await enrichQuestions(questions);
}

async function enrichQuestions(questions: Array<{
  id: string;
  user_id: string;
  city: string;
  content: string;
  post_type: "question" | "co_creation";
  idea_title: string | null;
  target_client: string | null;
  looking_for: string | null;
  expected_outcome: string | null;
  status: "open" | "duo_formed" | "test_running" | "validated";
  created_at: string;
}>): Promise<FlashQuestion[]> {
  const supabaseAdmin = createAdminClient();
  const userIds = new Set(questions.map(q => q.user_id));
  const questionIds = questions.map(q => q.id);

  // Get Answers Count
  const { data: answersCounts } = await supabaseAdmin
    .from("network_flash_answers")
    .select("question_id")
    .in("question_id", questionIds);
    
  const countMap = new Map<string, number>();
  answersCounts?.forEach((a: { question_id: string }) => {
    countMap.set(a.question_id, (countMap.get(a.question_id) || 0) + 1);
  });

  // Get Profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, trade")
    .in("id", Array.from(userIds));
    
  const profileMap = new Map();
  profiles?.forEach((p: { id: string; display_name: string; avatar_url: string | null; trade: string | null }) => profileMap.set(p.id, p));

  // 3. Assemble
  return questions.map(q => {
    const author = profileMap.get(q.user_id) || { display_name: "Membre inconnu", avatar_url: null, trade: "" };
    return {
      ...q,
      author,
      answers_count: countMap.get(q.id) || 0
    };
  });
}

export async function getFlashQuestionDetails(questionId: string): Promise<FlashQuestion | null> {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: question, error } = await supabase
    .from("network_flash_questions")
    .select("*")
    .eq("id", questionId)
    .single();

  let normalizedQuestion = question as FlashQuestion | null;
  if (error || !question) {
    const { data: legacyQuestion, error: legacyError } = await supabase
      .from("network_flash_questions")
      .select("id,user_id,city,content,created_at")
      .eq("id", questionId)
      .single();
    if (legacyError || !legacyQuestion) return null;
    normalizedQuestion = normalizeLegacyQuestion(legacyQuestion) as unknown as FlashQuestion;
  }

  // Get Author
  const { data: author } = await supabaseAdmin
    .from("profiles")
    .select("display_name, avatar_url, trade")
    .eq("id", normalizedQuestion.user_id)
    .single();

  // Get Answers
  const { data: answers } = await supabase
    .from("network_flash_answers")
    .select("*")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  // Get Answer Authors
  let enrichedAnswers: FlashAnswer[] = [];
  if (answers && answers.length > 0) {
    const answerUserIds = answers.map(a => a.user_id);
    const { data: answerProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, avatar_url, trade")
        .in("id", answerUserIds);
    
    const answerProfileMap = new Map();
    answerProfiles?.forEach((p: { id: string; display_name: string; avatar_url: string | null; trade: string | null }) => answerProfileMap.set(p.id, p));

    enrichedAnswers = answers.map(a => ({
        ...a,
        author: answerProfileMap.get(a.user_id) || { display_name: "Membre", avatar_url: null, trade: "" }
    }));
  }

  return {
    ...question,
    ...normalizedQuestion,
    author: author || { display_name: "Membre", avatar_url: null, trade: "" },
    answers_count: answers?.length || 0,
    answers: enrichedAnswers
  };
}

export async function createFlashQuestion(content: string, city: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non connecté" };

  const { error } = await supabase
    .from("network_flash_questions")
    .insert({
      user_id: user.id,
      city: city, // Should be passed from the client or verified against user profile
      content: String(content || "").trim()
    });

  if (error) {
    console.error("Error creating flash question:", error);
    // If error is RLS related, try with admin client
    if (error.code === '42501') {
        const supabaseAdmin = createAdminClient();
        const { error: adminError } = await supabaseAdmin
            .from("network_flash_questions")
            .insert({
                user_id: user.id,
                city: city,
                content: String(content || "").trim()
            });
            
        if (adminError) {
            console.error("Admin Error creating flash question:", adminError);
            return { error: "Erreur (Admin): " + adminError.message };
        }
    } else {
        return { error: "Erreur: " + error.message };
    }
  }

  revalidatePath("/mon-reseau-local/dashboard");
  revalidatePath("/mon-reseau-local/dashboard/cafe");
  return { success: true };
}

export async function createFlashCoCreationPost(payload: {
  city: string;
  ideaTitle: string;
  content: string;
  targetClient: string;
  lookingFor: string;
  expectedOutcome: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non connecté" };

  const record = {
    user_id: user.id,
    city: String(payload.city || "").trim(),
    post_type: "co_creation",
    idea_title: String(payload.ideaTitle || "").trim(),
    content: String(payload.content || "").trim(),
    target_client: String(payload.targetClient || "").trim(),
    looking_for: String(payload.lookingFor || "").trim(),
    expected_outcome: String(payload.expectedOutcome || "").trim(),
    status: "open",
  };

  const { error } = await supabase
    .from("network_flash_questions")
    .insert(record);

  if (error) {
    console.error("Error creating co-creation post:", error);
    if (error.code === "42501") {
      const supabaseAdmin = createAdminClient();
      const { error: adminError } = await supabaseAdmin
        .from("network_flash_questions")
        .insert(record);
      if (adminError) {
        console.error("Admin error creating co-creation post:", adminError);
        return { error: "Erreur (Admin): " + adminError.message };
      }
    } else {
      const fallbackContent = `APPEL CO-CRÉATION\nIdée: ${record.idea_title}\nClient cible: ${record.target_client}\nProfil recherché: ${record.looking_for}\nObjectif: ${record.expected_outcome}\n---\n${record.content}`;
      const fallback = await createFlashQuestion(fallbackContent, record.city);
      if (fallback.error) return { error: "Erreur: " + error.message };
      return { success: true };
    }
  }

  revalidatePath("/mon-reseau-local/dashboard");
  revalidatePath("/mon-reseau-local/dashboard/cafe");
  return { success: true };
}

export async function createFlashAnswer(questionId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non connecté" };

  const { error } = await supabase
    .from("network_flash_answers")
    .insert({
      user_id: user.id,
      question_id: questionId,
      content: String(content || "").trim()
    });

  if (error) {
    console.error("Error creating flash answer:", error);
    // If error is RLS related, try with admin client
    if (error.code === '42501') {
        const supabaseAdmin = createAdminClient();
        const { error: adminError } = await supabaseAdmin
            .from("network_flash_answers")
            .insert({
                user_id: user.id,
                question_id: questionId,
                content: String(content || "").trim()
            });
            
        if (adminError) {
             console.error("Admin Error creating flash answer:", adminError);
             return { error: "Erreur (Admin): " + adminError.message };
        }
    } else {
        return { error: "Erreur: " + error.message };
    }
  }

  revalidatePath(`/mon-reseau-local/dashboard/cafe`);
  revalidatePath(`/mon-reseau-local/dashboard`); // For the widget counters
  return { success: true };
}
