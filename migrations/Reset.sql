-- 005: views
DROP VIEW IF EXISTS v_profitable_movies       CASCADE;
DROP VIEW IF EXISTS v_crew_roster             CASCADE;
DROP VIEW IF EXISTS v_genre_performance       CASCADE;
DROP VIEW IF EXISTS v_top_paid_actors         CASCADE;
DROP VIEW IF EXISTS v_director_filmography    CASCADE;
DROP VIEW IF EXISTS v_movie_full_cast         CASCADE;
DROP VIEW IF EXISTS v_movie_financial_overview CASCADE;

-- 005: stored functions
DROP FUNCTION IF EXISTS get_director_roi(INT);
DROP FUNCTION IF EXISTS flag_over_budget_movies();
DROP FUNCTION IF EXISTS get_most_profitable_genre();
DROP FUNCTION IF EXISTS get_movies_by_actor(VARCHAR);
DROP FUNCTION IF EXISTS get_movie_full_roster(INT);
DROP FUNCTION IF EXISTS get_movie_total_spend(INT);

-- 004: add/remove functions
DROP FUNCTION IF EXISTS remove_producer_finance(INT, INT);
DROP FUNCTION IF EXISTS add_producer_finance(INT, INT, DECIMAL, DECIMAL, commission_type, contract_type, DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS remove_director_finance(INT, INT);
DROP FUNCTION IF EXISTS add_director_finance(INT, INT, DECIMAL, DECIMAL, commission_type, contract_type, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS remove_movie_finance(INT);
DROP FUNCTION IF EXISTS add_movie_finance(INT, DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS remove_movie_crew_member(INT, INT);
DROP FUNCTION IF EXISTS add_movie_crew_member(INT, INT, VARCHAR, DECIMAL);
DROP FUNCTION IF EXISTS remove_movie_producer(INT, INT);
DROP FUNCTION IF EXISTS add_movie_producer(INT, INT);
DROP FUNCTION IF EXISTS remove_movie_director(INT, INT);
DROP FUNCTION IF EXISTS add_movie_director(INT, INT);
DROP FUNCTION IF EXISTS remove_movie_actor(INT, INT);
DROP FUNCTION IF EXISTS add_movie_actor(INT, INT, VARCHAR, DECIMAL);
DROP FUNCTION IF EXISTS remove_crew_member(INT);
DROP FUNCTION IF EXISTS add_crew_member(VARCHAR, INT, VARCHAR);
DROP FUNCTION IF EXISTS remove_producer(INT);
DROP FUNCTION IF EXISTS add_producer(VARCHAR, INT, VARCHAR);
DROP FUNCTION IF EXISTS remove_director(INT);
DROP FUNCTION IF EXISTS add_director(VARCHAR, INT);
DROP FUNCTION IF EXISTS remove_actor(INT);
DROP FUNCTION IF EXISTS add_actor(VARCHAR, INT, VARCHAR);
DROP FUNCTION IF EXISTS remove_movie(INT);
DROP FUNCTION IF EXISTS add_movie(VARCHAR, VARCHAR, VARCHAR, INT);

-- 003: finance tables and types
DROP TABLE IF EXISTS DirectorFinance CASCADE;
DROP TABLE IF EXISTS ProducerFinance CASCADE;
DROP TABLE IF EXISTS MovieFinance CASCADE;
DROP TYPE IF EXISTS commission_type CASCADE;
DROP TYPE IF EXISTS contract_type CASCADE;

-- 002: junction tables
DROP TABLE IF EXISTS Movie_Actor CASCADE;
DROP TABLE IF EXISTS Movie_CrewMember CASCADE;
DROP TABLE IF EXISTS Movie_Director CASCADE;
DROP TABLE IF EXISTS Movie_Producer CASCADE;

-- 001: core tables
DROP TABLE IF EXISTS Actor CASCADE;
DROP TABLE IF EXISTS CrewMember CASCADE;
DROP TABLE IF EXISTS Director CASCADE;
DROP TABLE IF EXISTS Producer CASCADE;
DROP TABLE IF EXISTS Movie CASCADE;







