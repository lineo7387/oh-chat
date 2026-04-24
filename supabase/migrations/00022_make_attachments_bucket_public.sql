-- Make attachments bucket public so avatars and message attachments
-- can be loaded directly via <img> tags without signed URLs

update storage.buckets
set public = true
where id = 'attachments';
