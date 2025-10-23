--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-10-20 22:07:31

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 42260)
-- Name: missions; Type: TABLE; Schema: public; 
--

CREATE TABLE public.missions (
    id integer NOT NULL,
    pack_name text NOT NULL,
    mission_name text NOT NULL,
    in_game_name text,
    authors text[] DEFAULT '{}'::text[],
    date_added date,
    bombs jsonb NOT NULL,
    factory text,
    difficulty real
);

--
-- TOC entry 222 (class 1259 OID 42259)
-- Name: missions_id_seq; Type: SEQUENCE; Schema: public; 
--

CREATE SEQUENCE public.missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- TOC entry 4938 (class 0 OID 0)
-- Dependencies: 222
-- Name: missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; 
--

ALTER SEQUENCE public.missions_id_seq OWNED BY public.missions.id;


--
-- TOC entry 218 (class 1259 OID 16411)
-- Name: modules; Type: TABLE; Schema: public; 
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    module_id text NOT NULL,
    name text NOT NULL,
    description text,
    published date,
    developers text[],
    defuser_difficulty text,
    expert_difficulty text,
    tags text[],
    icon_file_name text,
    sort_key text,
    type text,
    boss_status text,
    quirks text[],
    periodic_table_element text
);




--
-- TOC entry 217 (class 1259 OID 16410)
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; 
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- TOC entry 4939 (class 0 OID 0)
-- Dependencies: 217
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; 
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- TOC entry 224 (class 1259 OID 45157)
-- Name: user_favourites; Type: TABLE; Schema: public; 
--

CREATE TABLE public.user_favourites (
    user_id bigint NOT NULL,
    bomb_id bigint NOT NULL
);




--
-- TOC entry 221 (class 1259 OID 16487)
-- Name: user_module_scores; Type: TABLE; Schema: public; 
--

CREATE TABLE public.user_module_scores (
    user_id character varying(50) NOT NULL,
    module_id text NOT NULL,
    defuser_confidence character varying(50) DEFAULT 'Unknown'::character varying,
    expert_confidence character varying(50) DEFAULT 'Unknown'::character varying,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    can_solo boolean
);




--
-- TOC entry 220 (class 1259 OID 16450)
-- Name: users; Type: TABLE; Schema: public; 
--

CREATE TABLE public.users (
    id integer NOT NULL,
    discord_id character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    avatar text
);




--
-- TOC entry 219 (class 1259 OID 16449)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; 
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- TOC entry 4940 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4766 (class 2604 OID 42263)
-- Name: missions id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.missions ALTER COLUMN id SET DEFAULT nextval('public.missions_id_seq'::regclass);


--
-- TOC entry 4760 (class 2604 OID 16414)
-- Name: modules id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- TOC entry 4761 (class 2604 OID 16453)
-- Name: users id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4779 (class 2606 OID 42270)
-- Name: missions missions_pack_name_mission_name_key; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_pack_name_mission_name_key UNIQUE (pack_name, mission_name);


--
-- TOC entry 4781 (class 2606 OID 42268)
-- Name: missions missions_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_pkey PRIMARY KEY (id);


--
-- TOC entry 4769 (class 2606 OID 16420)
-- Name: modules modules_module_id_key; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_module_id_key UNIQUE (module_id);


--
-- TOC entry 4771 (class 2606 OID 16418)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- TOC entry 4783 (class 2606 OID 45873)
-- Name: user_favourites user_favorites_pkey; Type: CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (user_id, bomb_id);


--
-- TOC entry 4777 (class 2606 OID 16496)
-- Name: user_module_scores user_module_scores_pkey; Type: CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.user_module_scores
    ADD CONSTRAINT user_module_scores_pkey PRIMARY KEY (user_id, module_id);


--
-- TOC entry 4773 (class 2606 OID 16460)
-- Name: users users_discord_id_key; Type: CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_discord_id_key UNIQUE (discord_id);


--
-- TOC entry 4775 (class 2606 OID 16458)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4786 (class 2606 OID 45874)
-- Name: user_favourites user_favorites_bomb_id_fkey; Type: FK CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favorites_bomb_id_fkey FOREIGN KEY (bomb_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- TOC entry 4787 (class 2606 OID 45863)
-- Name: user_favourites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4784 (class 2606 OID 22709)
-- Name: user_module_scores user_module_scores_module_id_fkey; Type: FK CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.user_module_scores
    ADD CONSTRAINT user_module_scores_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id) ON DELETE CASCADE;


--
-- TOC entry 4785 (class 2606 OID 16497)
-- Name: user_module_scores user_module_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; 
--

ALTER TABLE ONLY public.user_module_scores
    ADD CONSTRAINT user_module_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(discord_id) ON DELETE CASCADE;


-- Completed on 2025-10-20 22:07:31

--
-- PostgreSQL database dump complete
--

