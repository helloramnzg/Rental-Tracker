-- Storage for generated Statements of Account.
-- Private bucket — SOAs contain tenant financial data and must only be
-- accessible to the authenticated landlord, never anonymously.
-- Folder structure per docs/architecture/10-pdf-generation.md:
-- soa/{year}/{month}/{filename}.pdf

insert into storage.buckets (id, name, public)
values ('soa', 'soa', false)
on conflict (id) do nothing;

create policy "Authenticated users can manage soa objects"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'soa')
  with check (bucket_id = 'soa');
