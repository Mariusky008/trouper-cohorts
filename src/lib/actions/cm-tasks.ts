"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin"; // Import admin client
import { revalidatePath } from "next/cache";

export type CMTaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type CMPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CMPlatform = 'linkedin' | 'instagram' | 'tiktok' | 'newsletter' | 'website' | 'other' | 'design' | 'video' | 'research' | 'strategy' | 'admin';

export interface CMTask {
    id: string;
    title: string;
    description: string | null;
    status: CMTaskStatus;
    priority: CMPriority;
    due_date: string | null;
    created_at: string;
    platform: CMPlatform | null;
    link_url: string | null;
    feedback: string | null;
}

// 1. Fetch Tasks (Allow Guest Access if secret matches)
export async function getCMTasks(filter?: { status?: CMTaskStatus }, secretCode?: string) {
    const isGuest = secretCode === 'Mariusky007';
    
    // Use Admin Client if guest, else standard User Client
    const supabase = isGuest ? createAdminClient() : await createClient();
    
    let query = supabase
        .from('cm_tasks')
        .select('*')
        .order('priority', { ascending: false }) // Urgent first
        .order('due_date', { ascending: true }); // Soonest first

    if (filter?.status) {
        query = query.eq('status', filter.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching CM tasks:", error);
        return [];
    }

    return data as CMTask[];
}

// 2. Create Task (Allow Guest Access if secret matches)
export async function createCMTask(formData: FormData) {
    // Check for secret code in formData
    const secretCode = formData.get('secret_code') as string;
    const isGuest = secretCode === 'Mariusky007';

    // Decide which client to use
    const supabase = isGuest ? createAdminClient() : await createClient();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as CMPriority || 'medium';
    const due_date = formData.get('due_date') as string; // ISO string
    const platform = formData.get('platform') as CMPlatform;

    if (!title) return { error: "Title is required" };

    // let userIdToUse = null;

    if (isGuest) {
        // Guest Mode: Use Admin Client which bypasses RLS
        // No need to set user_id if column doesn't exist
    } else {
        // Standard Mode: Check if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: "You must be logged in to create a task" };
        }
        // userIdToUse = user.id;
    }

    const { error } = await supabase
        .from('cm_tasks')
        .insert({
            title,
            description,
            priority,
            due_date: due_date || null,
            platform: platform || 'other',
            status: 'todo'
            // NOTE: user_id column removed as it does not exist in DB schema
        });

    if (error) {
        console.error("Error creating task:", error);
        return { error: `Failed to create task: ${error.message} (Code: ${error.code})` };
    }

    revalidatePath('/cm-dashboard');
    revalidatePath('/mon-reseau-local/dashboard'); // Also revalidate main dashboard if tasks are shown there
    revalidatePath('/', 'layout'); // Force full revalidation to be safe
    return { success: true };
}

// 3. Update Status (Kanban drag/drop or button click)
export async function updateCMTaskStatus(id: string, status: CMTaskStatus) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('cm_tasks')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error("Error updating status:", error);
        return { error: "Failed to update status" };
    }

    revalidatePath('/cm-dashboard');
    revalidatePath('/mon-reseau-local/dashboard');
    revalidatePath('/', 'layout');
    return { success: true };
}

// 4. Update Task Details (Due date, priority, feedback)
export async function updateCMTask(id: string, updates: Partial<CMTask>) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('cm_tasks')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error("Error updating task:", error);
        return { error: "Failed to update task" };
    }

    revalidatePath('/cm-dashboard');
    return { success: true };
}

// 5. Delete Task
export async function deleteCMTask(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('cm_tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting task:", error);
        return { error: "Failed to delete task" };
    }

    revalidatePath('/cm-dashboard');
    return { success: true };
}