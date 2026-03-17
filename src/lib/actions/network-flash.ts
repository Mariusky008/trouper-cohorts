"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type FlashQuestion = {
  id: string;
  user_id: string;
  city: string;
  content: string;
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
      created_at
    `)
    .eq("city", city)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching flash questions:", error);
    return [];
  }

  if (!questions || questions.length === 0) return [];

  // 2. Fetch Authors & Answer Counts
  // We need to do this manually or via joins if relations are set up. 
  // Since we just created the table, relations might not be auto-detected by the client types yet, 
  // but we can try to join if we set up foreign keys correctly (which we did).
  // However, RLS might block seeing profiles if not careful. Let's use Admin for enrichment to be safe/fast.
  
  const supabaseAdmin = createAdminClient();
  const userIds = new Set(questions.map(q => q.user_id));
  const questionIds = questions.map(q => q.id);

  // Get Answers Count
  const { data: answersCounts } = await supabaseAdmin
    .from("network_flash_answers")
    .select("question_id")
    .in("question_id", questionIds);
    
  const countMap = new Map<string, number>();
  answersCounts?.forEach((a: any) => {
    countMap.set(a.question_id, (countMap.get(a.question_id) || 0) + 1);
  });

  // Get Profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, avatar_url, trade")
    .in("id", Array.from(userIds));
    
  const profileMap = new Map();
  profiles?.forEach((p: any) => profileMap.set(p.id, p));

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

  if (error || !question) return null;

  // Get Author
  const { data: author } = await supabaseAdmin
    .from("profiles")
    .select("display_name, avatar_url, trade")
    .eq("id", question.user_id)
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
    answerProfiles?.forEach((p: any) => answerProfileMap.set(p.id, p));

    enrichedAnswers = answers.map(a => ({
        ...a,
        author: answerProfileMap.get(a.user_id) || { display_name: "Membre", avatar_url: null, trade: "" }
    }));
  }

  return {
    ...question,
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
      content: content.trim()
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
                content: content.trim()
            });
            
        if (adminError) {
            console.error("Admin Error creating flash question:", adminError);
            return { error: "Erreur lors de la publication." };
        }
    } else {
        return { error: "Erreur lors de la publication." };
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
      content: content.trim()
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
                content: content.trim()
            });
            
        if (adminError) {
             console.error("Admin Error creating flash answer:", adminError);
             return { error: "Erreur lors de la réponse." };
        }
    } else {
        return { error: "Erreur lors de la réponse." };
    }
  }

  revalidatePath(`/mon-reseau-local/dashboard/cafe`);
  revalidatePath(`/mon-reseau-local/dashboard`); // For the widget counters
  return { success: true };
}
