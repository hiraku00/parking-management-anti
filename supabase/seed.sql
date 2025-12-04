-- Seed Owner (You must update the auth_id after creating the user in Auth > Users)
-- For now, we insert a placeholder. The user needs to sign up, then update this record.
insert into public.profiles (full_name, role, monthly_fee)
values 
('Owner', 'owner', 0)
on conflict (full_name) do nothing;

-- Seed Test Contractor
insert into public.profiles (full_name, role, monthly_fee)
values 
('Tanaka', 'contractor', 12000),
('Suzuki', 'contractor', 10000)
on conflict (full_name) do nothing;
