-- Add current_video_url to profiles
alter table profiles 
add column if not exists current_video_url text;
