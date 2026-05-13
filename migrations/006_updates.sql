-- ============================================================
-- UPDATE PERSON FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_actor(
    p_id         INT,
    p_name       VARCHAR,
    p_birth_year INT     DEFAULT NULL,
    p_gender     VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE Actor SET name = p_name, birth_year = p_birth_year, gender = p_gender
    WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Actor with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_director(
    p_id         INT,
    p_name       VARCHAR,
    p_birth_year INT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE Director SET name = p_name, birth_year = p_birth_year
    WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Director with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_producer(
    p_id         INT,
    p_name       VARCHAR,
    p_birth_year INT     DEFAULT NULL,
    p_gender     VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE Producer SET name = p_name, birth_year = p_birth_year, gender = p_gender
    WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producer with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_crew_member(
    p_id         INT,
    p_name       VARCHAR,
    p_birth_year INT     DEFAULT NULL,
    p_gender     VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE CrewMember SET name = p_name, birth_year = p_birth_year, gender = p_gender
    WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CrewMember with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- UPDATE JUNCTION TABLE FUNCTIONS (RE-ASSIGN)
-- ============================================================

CREATE OR REPLACE FUNCTION update_movie_actor(
    p_movie_id INT,
    p_actor_id INT,
    p_role     VARCHAR        DEFAULT NULL,
    p_salary   DECIMAL(15, 2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE Movie_Actor
    SET role = p_role, salary = p_salary
    WHERE movie_id = p_movie_id AND actor_id = p_actor_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie_Actor entry (movie_id=%, actor_id=%) not found', p_movie_id, p_actor_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_movie_crew_member(
    p_movie_id       INT,
    p_crew_member_id INT,
    p_job_title      VARCHAR        DEFAULT NULL,
    p_salary         DECIMAL(15, 2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE Movie_CrewMember
    SET job_title = p_job_title, salary = p_salary
    WHERE movie_id = p_movie_id AND crew_member_id = p_crew_member_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie_CrewMember entry (movie_id=%, crew_member_id=%) not found', p_movie_id, p_crew_member_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- IMPROVED get_movie_full_roster
-- Adds salary_or_investment column:
--   Actors/Crew  → salary
--   Producers    → investment
--   Directors    → NULL
-- ============================================================

CREATE OR REPLACE FUNCTION get_movie_full_roster(p_movie_id INT)
RETURNS TABLE (
    person_type          VARCHAR,
    person_id            INT,
    person_name          VARCHAR,
    role_detail          VARCHAR,
    salary_or_investment DECIMAL
) AS $$
BEGIN
    -- Actors
    RETURN QUERY
        SELECT 'Actor'::VARCHAR, a.id, a.name, ma.role, ma.salary
        FROM Movie_Actor ma
        JOIN Actor a ON a.id = ma.actor_id
        WHERE ma.movie_id = p_movie_id;

    -- Crew
    RETURN QUERY
        SELECT 'Crew'::VARCHAR, cm.id, cm.name, mc.job_title, mc.salary
        FROM Movie_CrewMember mc
        JOIN CrewMember cm ON cm.id = mc.crew_member_id
        WHERE mc.movie_id = p_movie_id;

    -- Directors
    RETURN QUERY
        SELECT 'Director'::VARCHAR, d.id, d.name, NULL::VARCHAR, NULL::DECIMAL
        FROM Movie_Director md
        JOIN Director d ON d.id = md.director_id
        WHERE md.movie_id = p_movie_id;

    -- Producers
    RETURN QUERY
        SELECT 'Producer'::VARCHAR, p.id, p.name, NULL::VARCHAR, mp.investment
        FROM Movie_Producer mp
        JOIN Producer p ON p.id = mp.producer_id
        WHERE mp.movie_id = p_movie_id;
END;
$$ LANGUAGE plpgsql;
