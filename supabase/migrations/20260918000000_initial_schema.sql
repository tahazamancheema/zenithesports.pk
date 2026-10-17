-- Create Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'active', 'completed');
CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'waitlisted', 'rejected');
CREATE TYPE payment_status AS ENUM ('unpaid', 'pending_verification', 'verified', 'rejected');
CREATE TYPE payment_method AS ENUM ('jazzcash', 'easypaisa', 'bank', 'none');

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  discord_id TEXT UNIQUE,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Teams Table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  captain_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Team Members Table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL, -- e.g., 'valorant', 'pubgm', 'freefire'
  in_game_name TEXT NOT NULL,
  role TEXT DEFAULT 'player', -- e.g., 'player', 'coach', 'sub'
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(team_id, profile_id, game_id)
);

-- Tournaments Table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  game TEXT NOT NULL, -- e.g., 'valorant'
  status tournament_status DEFAULT 'draft'::tournament_status NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  prize_pool TEXT,
  max_teams INTEGER NOT NULL DEFAULT 16,
  entry_fee_pkr INTEGER DEFAULT 0,
  rules_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Registrations Table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  status registration_status DEFAULT 'pending'::registration_status NOT NULL,
  payment_status payment_status DEFAULT 'unpaid'::payment_status NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(tournament_id, team_id)
);

-- Payments Table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  amount_pkr INTEGER NOT NULL,
  method payment_method DEFAULT 'none'::payment_method NOT NULL,
  proof_image_url TEXT,
  status payment_status DEFAULT 'pending_verification'::payment_status NOT NULL,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Draft)
-- We will expand these in a separate file, but here is the base configuration.

-- Profiles: Users can view all profiles, but only update their own.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Teams: Anyone can view, only captains can update.
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Captains can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Captains can update their teams" ON public.teams FOR UPDATE USING (auth.uid() = captain_id);

-- Tournaments: Public read, Admin write.
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
-- (Admin policies will rely on a secure admin check RPC, omitting for now to prevent insecure writes)

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
