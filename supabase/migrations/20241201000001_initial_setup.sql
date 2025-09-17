-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    company TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    items JSONB,
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create bling_integrations table
CREATE TABLE IF NOT EXISTS public.bling_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    api_key TEXT,
    client_id TEXT,
    client_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bling_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert own tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON public.tickets
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete own tickets" ON public.tickets
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders" ON public.orders
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bling integrations" ON public.bling_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bling integrations" ON public.bling_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bling integrations" ON public.bling_integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bling integrations" ON public.bling_integrations
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.bling_integrations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_bling_integrations_user_id ON public.bling_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);