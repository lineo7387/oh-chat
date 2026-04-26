-- Make voice-messages bucket public so getPublicUrl() works for playback
update storage.buckets
set public = true
where id = 'voice-messages';
