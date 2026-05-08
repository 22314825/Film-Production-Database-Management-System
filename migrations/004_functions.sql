-- ============================================================
-- MOVIE
-- ============================================================

CREATE OR REPLACE FUNCTION add_movie(
    p_title        VARCHAR,
    p_genre        VARCHAR DEFAULT NULL,
    p_topic        VARCHAR DEFAULT NULL,
    p_release_year INT     DEFAULT NULL
) RETURNS Movie AS $$
DECLARE
    v_row Movie;
BEGIN
    INSERT INTO Movie (title, genre, topic, release_year)
    VALUES (p_title, p_genre, p_topic, p_release_year)
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_movie(p_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Movie WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- ACTOR
-- ============================================================

CREATE OR REPLACE FUNCTION add_actor(
    p_name       VARCHAR,
    p_birth_year INT     DEFAULT NULL,
    p_gender     VARCHAR DEFAULT NULL
) RETURNS Actor AS $$
DECLARE
    v_row Actor;
BEGIN
    INSERT INTO Actor (name, birth_year, gender)
    VALUES (p_name, p_birth_year, p_gender)
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_actor(p_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Actor WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Actor with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- DIRECTOR
-- ============================================================

CREATE OR REPLACE FUNCTION add_director(
    p_name       VARCHAR,
    p_birth_year INT DEFAULT NULL
) RETURNS Director AS $$
DECLARE
    v_row Director;
BEGIN
    INSERT INTO Director (name, birth_year)
    VALUES (p_name, p_birth_year)
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_director(p_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Director WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Director with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- PRODUCER
-- ============================================================

CREATE OR REPLACE FUNCTION add_producer(
    p_name       VARCHAR,
    p_birth_year INT     DEFAULT NULL,
    p_gender     VARCHAR DEFAULT NULL
) RETURNS Producer AS $$
DECLARE
    v_row Producer;
BEGIN
    INSERT INTO Producer (name, birth_year, gender)
    VALUES (p_name, p_birth_year, p_gender)
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_producer(p_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Producer WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producer with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- CREW MEMBER
-- ============================================================

CREATE OR REPLACE FUNCTION add_crew_member(
    p_name       VARCHAR,
    p_birth_year INT     DEFAULT NULL,
    p_gender     VARCHAR DEFAULT NULL
) RETURNS CrewMember AS $$
DECLARE
    v_row CrewMember;
BEGIN
    INSERT INTO CrewMember (name, birth_year, gender)
    VALUES (p_name, p_birth_year, p_gender)
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_crew_member(p_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM CrewMember WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CrewMember with id % not found', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- MOVIE_ACTOR  (casting)
-- ============================================================

CREATE OR REPLACE FUNCTION add_movie_actor(
    p_movie_id INT,
    p_actor_id INT,
    p_role     VARCHAR        DEFAULT NULL,
    p_salary   DECIMAL(15, 2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO Movie_Actor (movie_id, actor_id, role, salary)
    VALUES (p_movie_id, p_actor_id, p_role, p_salary);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_movie_actor(p_movie_id INT, p_actor_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Movie_Actor WHERE movie_id = p_movie_id AND actor_id = p_actor_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie_Actor entry (movie_id=%, actor_id=%) not found', p_movie_id, p_actor_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- MOVIE_DIRECTOR
-- ============================================================

CREATE OR REPLACE FUNCTION add_movie_director(p_movie_id INT, p_director_id INT) RETURNS VOID AS $$
BEGIN
    INSERT INTO Movie_Director (movie_id, director_id)
    VALUES (p_movie_id, p_director_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_movie_director(p_movie_id INT, p_director_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Movie_Director WHERE movie_id = p_movie_id AND director_id = p_director_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie_Director entry (movie_id=%, director_id=%) not found', p_movie_id, p_director_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- MOVIE_PRODUCER
-- ============================================================

CREATE OR REPLACE FUNCTION add_movie_producer(p_movie_id INT, p_producer_id INT) RETURNS VOID AS $$
BEGIN
    INSERT INTO Movie_Producer (movie_id, producer_id)
    VALUES (p_movie_id, p_producer_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_movie_producer(p_movie_id INT, p_producer_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Movie_Producer WHERE movie_id = p_movie_id AND producer_id = p_producer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie_Producer entry (movie_id=%, producer_id=%) not found', p_movie_id, p_producer_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- MOVIE_CREWMEMBER
-- ============================================================

CREATE OR REPLACE FUNCTION add_movie_crew_member(
    p_movie_id       INT,
    p_crew_member_id INT,
    p_job_title      VARCHAR        DEFAULT NULL,
    p_salary         DECIMAL(15, 2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO Movie_CrewMember (movie_id, crew_member_id, job_title, salary)
    VALUES (p_movie_id, p_crew_member_id, p_job_title, p_salary);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_movie_crew_member(p_movie_id INT, p_crew_member_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM Movie_CrewMember WHERE movie_id = p_movie_id AND crew_member_id = p_crew_member_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie_CrewMember entry (movie_id=%, crew_member_id=%) not found', p_movie_id, p_crew_member_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- MOVIEFINANCE
-- ============================================================

CREATE OR REPLACE FUNCTION add_movie_finance(
    p_movie_id           INT,
    p_budget             DECIMAL(15, 2) DEFAULT NULL,
    p_production_cost    DECIMAL(15, 2) DEFAULT NULL,
    p_marketing_cost     DECIMAL(15, 2) DEFAULT NULL,
    p_box_office_revenue DECIMAL(15, 2) DEFAULT NULL
) RETURNS MovieFinance AS $$
DECLARE
    v_row MovieFinance;
BEGIN
    INSERT INTO MovieFinance (movie_id, budget, production_cost, marketing_cost, box_office_revenue)
    VALUES (p_movie_id, p_budget, p_production_cost, p_marketing_cost, p_box_office_revenue)
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_movie_finance(p_movie_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM MovieFinance WHERE movie_id = p_movie_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'MovieFinance for movie_id=% not found', p_movie_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- DIRECTORFINANCE
-- ============================================================

CREATE OR REPLACE FUNCTION add_director_finance(
    p_director_id     INT,
    p_movie_id        INT,
    p_base_fee        DECIMAL(15, 2)  DEFAULT NULL,
    p_commission_rate DECIMAL(5, 2)   DEFAULT NULL,
    p_commission_type commission_type DEFAULT NULL,
    p_contract_type   contract_type   DEFAULT NULL,
    p_bonus           DECIMAL(15, 2)  DEFAULT NULL,
    p_total_payout    DECIMAL(15, 2)  DEFAULT NULL
) RETURNS DirectorFinance AS $$
DECLARE
    v_row DirectorFinance;
BEGIN
    INSERT INTO DirectorFinance (
        director_id, movie_id, base_fee, commission_rate,
        commission_type, contract_type, bonus, total_payout
    )
    VALUES (
        p_director_id, p_movie_id, p_base_fee, p_commission_rate,
        p_commission_type, p_contract_type, p_bonus, p_total_payout
    )
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_director_finance(p_director_id INT, p_movie_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM DirectorFinance WHERE director_id = p_director_id AND movie_id = p_movie_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'DirectorFinance for director_id=%, movie_id=% not found', p_director_id, p_movie_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- PRODUCERFINANCE
-- ============================================================

CREATE OR REPLACE FUNCTION add_producer_finance(
    p_producer_id       INT,
    p_movie_id          INT,
    p_base_fee          DECIMAL(15, 2)  DEFAULT NULL,
    p_commission_rate   DECIMAL(5, 2)   DEFAULT NULL,
    p_commission_type   commission_type DEFAULT NULL,
    p_contract_type     contract_type   DEFAULT NULL,
    p_profit_share_rate DECIMAL(5, 2)   DEFAULT NULL,
    p_movie_net_profit  DECIMAL(15, 2)  DEFAULT NULL,
    p_bonus             DECIMAL(15, 2)  DEFAULT NULL,
    p_total_payout      DECIMAL(15, 2)  DEFAULT NULL
) RETURNS ProducerFinance AS $$
DECLARE
    v_row ProducerFinance;
BEGIN
    INSERT INTO ProducerFinance (
        producer_id, movie_id, base_fee, commission_rate, commission_type,
        contract_type, profit_share_rate, movie_net_profit, bonus, total_payout
    )
    VALUES (
        p_producer_id, p_movie_id, p_base_fee, p_commission_rate, p_commission_type,
        p_contract_type, p_profit_share_rate, p_movie_net_profit, p_bonus, p_total_payout
    )
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_producer_finance(p_producer_id INT, p_movie_id INT) RETURNS VOID AS $$
BEGIN
    DELETE FROM ProducerFinance WHERE producer_id = p_producer_id AND movie_id = p_movie_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ProducerFinance for producer_id=%, movie_id=% not found', p_producer_id, p_movie_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
