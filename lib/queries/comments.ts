import { createClient } from '../supabase/client';

export async function addGoalComment(
  goalId: string,
  userId: string,
  text: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('comments')
    .insert({
      goal_id: goalId,
      user_id: userId,
      text: text
    });

  if (error) {
    console.error('Error adding comment:', error);
    return false;
  }

  return true;
}
