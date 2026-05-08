-- ============================================================
-- VIEWS  (useful SQL queries)
-- ============================================================

-- 1. Full financial overview per movie (ROI included)
CREATE OR REPLACE VIEW v_movie_financial_overview AS
SELECT
    m.id                                          AS movie_id,
    m.title,
    m.genre,
    m.release_year,
    mf.budget,
    mf.production_cost,
    mf.marketing_cost,
    mf.box_office_revenue,
    mf.net_profit,
    CASE
        WHEN mf.budget > 0
        THEN ROUND((mf.net_profit / mf.budget) * 100, 2)
        ELSE NULL
    END                                           AS roi_pct
FROM Movie m
JOIN MovieFinance mf ON mf.movie_id = m.id;


-- 2. Full cast per movie (actors with roles and salaries)
CREATE OR REPLACE VIEW v_movie_full_cast AS
SELECT
    m.id        AS movie_id,
    m.title     AS movie_title,
    a.id        AS actor_id,
    a.name      AS actor_name,
    a.gender,
    ma.role,
    ma.salary   AS actor_salary
FROM Movie m
JOIN Movie_Actor ma ON ma.movie_id = m.id
JOIN Actor       a  ON a.id        = ma.actor_id;


-- 3. Director filmography with movie count and average budget
CREATE OR REPLACE VIEW v_director_filmography AS
SELECT
    d.id                                    AS director_id,
    d.name                                  AS director_name,
    COUNT(md.movie_id)                      AS movie_count,
    ROUND(AVG(mf.budget), 2)               AS avg_budget,
    ROUND(AVG(mf.net_profit), 2)           AS avg_net_profit
FROM Director d
LEFT JOIN Movie_Director md ON md.director_id = d.id
LEFT JOIN MovieFinance   mf ON mf.movie_id    = md.movie_id
GROUP BY d.id, d.name;


-- 4. Actors ranked by total earnings across all movies
CREATE OR REPLACE VIEW v_top_paid_actors AS
SELECT
    a.id                        AS actor_id,
    a.name                      AS actor_name,
    COUNT(ma.movie_id)          AS movies_count,
    SUM(ma.salary)              AS total_earnings,
    ROUND(AVG(ma.salary), 2)   AS avg_salary_per_movie
FROM Actor a
JOIN Movie_Actor ma ON ma.actor_id = a.id
WHERE ma.salary IS NOT NULL
GROUP BY a.id, a.name
ORDER BY total_earnings DESC NULLS LAST;


-- 5. Genre-level aggregated financial performance
CREATE OR REPLACE VIEW v_genre_performance AS
SELECT
    m.genre,
    COUNT(DISTINCT m.id)            AS movie_count,
    ROUND(AVG(mf.budget), 2)       AS avg_budget,
    ROUND(SUM(mf.box_office_revenue), 2) AS total_revenue,
    ROUND(AVG(mf.net_profit), 2)   AS avg_net_profit,
    ROUND(
        SUM(mf.net_profit) / NULLIF(SUM(mf.budget), 0) * 100, 2
    )                               AS genre_roi_pct
FROM Movie m
JOIN MovieFinance mf ON mf.movie_id = m.id
WHERE m.genre IS NOT NULL
GROUP BY m.genre
ORDER BY avg_net_profit DESC NULLS LAST;


-- 6. Full crew roster per movie
CREATE OR REPLACE VIEW v_crew_roster AS
SELECT
    m.id        AS movie_id,
    m.title     AS movie_title,
    cm.id       AS crew_member_id,
    cm.name     AS crew_member_name,
    mc.job_title,
    mc.salary   AS crew_salary
FROM Movie m
JOIN Movie_CrewMember mc ON mc.movie_id       = m.id
JOIN CrewMember       cm ON cm.id             = mc.crew_member_id;


-- 7. Profitable movies ranked by net profit
CREATE OR REPLACE VIEW v_profitable_movies AS
SELECT
    m.id            AS movie_id,
    m.title,
    m.genre,
    m.release_year,
    mf.budget,
    mf.net_profit,
    RANK() OVER (ORDER BY mf.net_profit DESC) AS profit_rank
FROM Movie m
JOIN MovieFinance mf ON mf.movie_id = m.id
WHERE mf.net_profit > 0
ORDER BY mf.net_profit DESC;


-- ============================================================
-- PL/pgSQL STORED FUNCTIONS
-- ============================================================

-- 1. Total spend for a movie: all actor + crew salaries + production + marketing costs
CREATE OR REPLACE FUNCTION get_movie_total_spend(p_movie_id INT)
RETURNS TABLE (
    movie_id         INT,
    title            VARCHAR,
    actor_payroll    DECIMAL,
    crew_payroll     DECIMAL,
    production_cost  DECIMAL,
    marketing_cost   DECIMAL,
    total_spend      DECIMAL
) AS $$
DECLARE
    v_actor_pay  DECIMAL;
    v_crew_pay   DECIMAL;
    v_prod_cost  DECIMAL;
    v_mkt_cost   DECIMAL;
    v_title      VARCHAR;
BEGIN
    SELECT m.title INTO v_title FROM Movie m WHERE m.id = p_movie_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie with id % not found', p_movie_id;
    END IF;

    SELECT COALESCE(SUM(ma.salary), 0) INTO v_actor_pay
    FROM Movie_Actor ma WHERE ma.movie_id = p_movie_id;

    SELECT COALESCE(SUM(mc.salary), 0) INTO v_crew_pay
    FROM Movie_CrewMember mc WHERE mc.movie_id = p_movie_id;

    SELECT COALESCE(mf.production_cost, 0),
           COALESCE(mf.marketing_cost, 0)
    INTO v_prod_cost, v_mkt_cost
    FROM MovieFinance mf WHERE mf.movie_id = p_movie_id;

    RETURN QUERY SELECT
        p_movie_id,
        v_title,
        v_actor_pay,
        v_crew_pay,
        v_prod_cost,
        v_mkt_cost,
        v_actor_pay + v_crew_pay + v_prod_cost + v_mkt_cost;
END;
$$ LANGUAGE plpgsql;


-- 2. Everyone involved in a movie (actors, crew, directors, producers)
CREATE OR REPLACE FUNCTION get_movie_full_roster(p_movie_id INT)
RETURNS TABLE (
    person_type VARCHAR,
    person_id   INT,
    person_name VARCHAR,
    role_detail VARCHAR
) AS $$
BEGIN
    -- Actors
    RETURN QUERY
        SELECT 'Actor'::VARCHAR, a.id, a.name, ma.role
        FROM Movie_Actor ma
        JOIN Actor a ON a.id = ma.actor_id
        WHERE ma.movie_id = p_movie_id;

    -- Crew
    RETURN QUERY
        SELECT 'Crew'::VARCHAR, cm.id, cm.name, mc.job_title
        FROM Movie_CrewMember mc
        JOIN CrewMember cm ON cm.id = mc.crew_member_id
        WHERE mc.movie_id = p_movie_id;

    -- Directors
    RETURN QUERY
        SELECT 'Director'::VARCHAR, d.id, d.name, NULL::VARCHAR
        FROM Movie_Director md
        JOIN Director d ON d.id = md.director_id
        WHERE md.movie_id = p_movie_id;

    -- Producers
    RETURN QUERY
        SELECT 'Producer'::VARCHAR, p.id, p.name, NULL::VARCHAR
        FROM Movie_Producer mp
        JOIN Producer p ON p.id = mp.producer_id
        WHERE mp.movie_id = p_movie_id;
END;
$$ LANGUAGE plpgsql;


-- 3. Find movies by actor name (partial, case-insensitive)
CREATE OR REPLACE FUNCTION get_movies_by_actor(p_actor_name VARCHAR)
RETURNS TABLE (
    movie_id    INT,
    movie_title VARCHAR,
    release_year INT,
    role        VARCHAR,
    salary      DECIMAL
) AS $$
BEGIN
    RETURN QUERY
        SELECT m.id, m.title, m.release_year, ma.role, ma.salary
        FROM Movie m
        JOIN Movie_Actor ma ON ma.movie_id = m.id
        JOIN Actor       a  ON a.id        = ma.actor_id
        WHERE a.name ILIKE '%' || p_actor_name || '%'
        ORDER BY m.release_year DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;


-- 4. Genre with the highest average net profit
CREATE OR REPLACE FUNCTION get_most_profitable_genre()
RETURNS TABLE (
    genre            VARCHAR,
    movie_count      BIGINT,
    avg_net_profit   DECIMAL,
    total_revenue    DECIMAL
) AS $$
BEGIN
    RETURN QUERY
        SELECT
            m.genre,
            COUNT(DISTINCT m.id),
            ROUND(AVG(mf.net_profit), 2),
            ROUND(SUM(mf.box_office_revenue), 2)
        FROM Movie m
        JOIN MovieFinance mf ON mf.movie_id = m.id
        WHERE m.genre IS NOT NULL
        GROUP BY m.genre
        ORDER BY AVG(mf.net_profit) DESC NULLS LAST
        LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- 5. Movies where production_cost exceeded the approved budget
CREATE OR REPLACE FUNCTION flag_over_budget_movies()
RETURNS TABLE (
    movie_id         INT,
    title            VARCHAR,
    budget           DECIMAL,
    production_cost  DECIMAL,
    overrun          DECIMAL,
    overrun_pct      DECIMAL
) AS $$
BEGIN
    RETURN QUERY
        SELECT
            m.id,
            m.title,
            mf.budget,
            mf.production_cost,
            mf.production_cost - mf.budget,
            CASE
                WHEN mf.budget > 0
                THEN ROUND(((mf.production_cost - mf.budget) / mf.budget) * 100, 2)
                ELSE NULL
            END
        FROM Movie m
        JOIN MovieFinance mf ON mf.movie_id = m.id
        WHERE mf.production_cost > mf.budget
        ORDER BY (mf.production_cost - mf.budget) DESC;
END;
$$ LANGUAGE plpgsql;


-- 6. Average ROI across all movies directed by a given director
CREATE OR REPLACE FUNCTION get_director_roi(p_director_id INT)
RETURNS TABLE (
    director_id      INT,
    director_name    VARCHAR,
    movies_directed  BIGINT,
    avg_roi_pct      DECIMAL,
    best_roi_pct     DECIMAL,
    worst_roi_pct    DECIMAL
) AS $$
BEGIN
    RETURN QUERY
        SELECT
            d.id,
            d.name,
            COUNT(DISTINCT md.movie_id),
            ROUND(AVG(
                CASE WHEN mf.budget > 0 THEN (mf.net_profit / mf.budget) * 100 ELSE NULL END
            ), 2),
            ROUND(MAX(
                CASE WHEN mf.budget > 0 THEN (mf.net_profit / mf.budget) * 100 ELSE NULL END
            ), 2),
            ROUND(MIN(
                CASE WHEN mf.budget > 0 THEN (mf.net_profit / mf.budget) * 100 ELSE NULL END
            ), 2)
        FROM Director d
        JOIN Movie_Director md ON md.director_id = d.id
        JOIN MovieFinance   mf ON mf.movie_id    = md.movie_id
        WHERE d.id = p_director_id
        GROUP BY d.id, d.name;
END;
$$ LANGUAGE plpgsql;
