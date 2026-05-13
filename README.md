## ER Diagram

##  DDL – Data Definition Language (Schema)

### 🟦**Movie Table**
```sql
CREATE TABLE Movie (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    topic VARCHAR(100),
    release_year INT,
    status VARCHAR(20) DEFAULT 'draft'
);
```
---
### 🟩**Producer Table**
```sql
CREATE TABLE Producer
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT,
    gender VARCHAR(10)
);

```
---

### 🟦**Director Table**
```sql

CREATE TABLE Director
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT
);

```
---

### 🟩**Actor Table**
```sql
CREATE TABLE Actor
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT, 
    gender VARCHAR(10)
     --role VARCHAR(100),
     --salary DECIMAL(15)
);
```
---

### 🟦**CrewMember Table**
```sql
CREATE TABLE CrewMember
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT,
    gender VARCHAR(10)
     --job_title VARCHAR(100),
     --salary DECIMAL(15)
);

```
---

### 🟩**Movie_Actor Table**

```sql
CREATE TABLE Movie_Actor
(
    movie_id  INT          NOT NULL REFERENCES Movie(id)  ON DELETE CASCADE,
    actor_id  INT          NOT NULL REFERENCES Actor(id)  ON DELETE CASCADE,
    role      VARCHAR(100),
    salary    DECIMAL(15, 2),
    PRIMARY KEY (movie_id, actor_id)
);
```
---

### 🟦**Movie_CrewMember Table**

```sql
CREATE TABLE Movie_CrewMember
(
    movie_id       INT          NOT NULL REFERENCES Movie(id)       ON DELETE CASCADE,
    crew_member_id INT          NOT NULL REFERENCES CrewMember(id)  ON DELETE CASCADE,
    job_title      VARCHAR(100),
    salary         DECIMAL(15, 2),
    PRIMARY KEY (movie_id, crew_member_id)
);
```
---

### 🟩**Movie_Director Table**

```sql
CREATE TABLE Movie_Director
(
    movie_id    INT NOT NULL REFERENCES Movie(id)    ON DELETE CASCADE,
    director_id INT NOT NULL REFERENCES Director(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, director_id)
);
```
---

### 🟦**Movie_Producer Table**

```sql
CREATE TABLE Movie_Producer
(
    movie_id    INT NOT NULL REFERENCES Movie(id)    ON DELETE CASCADE,
    producer_id INT NOT NULL REFERENCES Producer(id) ON DELETE CASCADE,
    investment  DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (movie_id, producer_id)
);
```
---
### 🟩**MovieFinance Table**
```sql
CREATE TABLE MovieFinance
(
    id                 SERIAL PRIMARY KEY,
    movie_id           INT           NOT NULL UNIQUE REFERENCES Movie(id) ON DELETE CASCADE,
    budget             DECIMAL(15, 2), -- maintained by trg_sync_movie_budget trigger
    production_cost    DECIMAL(15, 2),
    marketing_cost     DECIMAL(15, 2),
    box_office_revenue DECIMAL(15, 2),
    -- auto-derived: revenue minus all costs
    net_profit         DECIMAL(15, 2) GENERATED ALWAYS AS (box_office_revenue - production_cost - marketing_cost) STORED
);
```
---

### 🟦**DirectorFinance Table**
```sql
CREATE TABLE DirectorFinance
(
    id               SERIAL PRIMARY KEY,
    director_id      INT             NOT NULL REFERENCES Director(id) ON DELETE CASCADE,
    movie_id         INT             NOT NULL REFERENCES Movie(id)    ON DELETE CASCADE,
    base_fee         DECIMAL(15, 2),
    commission_rate  DECIMAL(5, 2),   -- percentage (e.g. 5.00 = 5%)
    commission_type  commission_type,
    contract_type    contract_type,
    bonus            DECIMAL(15, 2),
    total_payout     DECIMAL(15, 2),
    UNIQUE (director_id, movie_id)
);
```
---

### 🟩**ProducerFinance Table**
```sql

CREATE TABLE ProducerFinance
(   
    id                      SERIAL PRIMARY KEY,
    producer_id             INT             NOT NULL REFERENCES Producer(id) ON DELETE CASCADE,
    movie_id                INT             NOT NULL REFERENCES Movie(id)    ON DELETE CASCADE,
    base_fee                DECIMAL(15, 2),
    commission_rate         DECIMAL(5, 2),
    commission_type         commission_type,
    contract_type           contract_type,
    
    -- profit_share_rate: the negotiated % of net profit this producer is entitled to
    profit_share_rate       DECIMAL(5, 2),
    
    -- movie_net_profit: denormalized from MovieFinance so the generated column can reference it
    movie_net_profit        DECIMAL(15, 2),
    
    -- auto-derived: producer's actual dollar share of the film's net profit
    executive_profit_share  DECIMAL(15, 2) GENERATED ALWAYS AS (movie_net_profit * profit_share_rate / 100.0) STORED,
    bonus                   DECIMAL(15, 2),
    total_payout            DECIMAL(15, 2),
    UNIQUE (producer_id, movie_id)
);
```
---
## DML - Data Manipulation Language

### MOVIE
---
```sql
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

CREATE OR REPLACE FUNCTION publish_movie(
    p_id INT,
    p_title VARCHAR,
    p_genre VARCHAR,
    p_topic VARCHAR,
    p_release_year INT
) RETURNS Movie AS $$
DECLARE
    v_finance_exists BOOLEAN;
    v_row Movie;
BEGIN
    IF p_title IS NULL OR p_genre IS NULL OR p_topic IS NULL OR p_release_year IS NULL THEN
        RAISE EXCEPTION 'Cannot publish movie: title, genre, topic, and release_year must be provided.';
    END IF;

    SELECT EXISTS(SELECT 1 FROM MovieFinance WHERE movie_id = p_id) INTO v_finance_exists;
    IF NOT v_finance_exists THEN
        RAISE EXCEPTION 'Cannot publish movie: no financial records found. Assign producers and finances first.';
    END IF;

    UPDATE Movie
    SET title = p_title,
        genre = p_genre,
        topic = p_topic,
        release_year = p_release_year,
        status = 'published'
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie with id % not found', p_id;
    END IF;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql;

-- User's requested migration script to update existing complete movies
UPDATE Movie SET status = 'published' WHERE release_year IS NOT NULL AND genre IS NOT NULL AND topic IS NOT NULL;
```
---
### ACTOR
```sql
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
```
---
### DIRECTOR
```sql
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
```
---
### PRODUCER
```sql
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
```
---
### CREW MEMBER
```sql
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
```
---
### MOVIE_ACTOR  (casting)
```sql
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
```
---
### MOVIE_DIRECTOR
```sql
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
```
---
### MOVIE_PRODUCER
```sql
CREATE OR REPLACE FUNCTION add_movie_producer(
    p_movie_id INT, 
    p_producer_id INT, 
    p_investment DECIMAL(15, 2)
) RETURNS VOID AS $$
BEGIN
    INSERT INTO Movie_Producer (movie_id, producer_id, investment)
    VALUES (p_movie_id, p_producer_id, p_investment);
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

CREATE OR REPLACE FUNCTION update_movie_producer_investment(
    p_movie_id INT, 
    p_producer_id INT, 
    p_investment DECIMAL(15, 2)
) RETURNS VOID AS $$
BEGIN
    UPDATE Movie_Producer 
    SET investment = p_investment 
    WHERE movie_id = p_movie_id AND producer_id = p_producer_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Movie_Producer entry (movie_id=%, producer_id=%) not found', p_movie_id, p_producer_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_sync_movie_budget()
RETURNS TRIGGER AS $$
DECLARE
    v_movie_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_movie_id := OLD.movie_id;
    ELSE
        v_movie_id := NEW.movie_id;
    END IF;

    UPDATE MovieFinance
    SET budget = (SELECT COALESCE(SUM(investment), 0) FROM Movie_Producer WHERE movie_id = v_movie_id)
    WHERE movie_id = v_movie_id;
    
    RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_movie_budget
AFTER INSERT OR UPDATE OR DELETE ON Movie_Producer
FOR EACH ROW EXECUTE FUNCTION trg_sync_movie_budget();
```
---
### MOVIE_CREWMEMBER
```sql
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
```
---
### MOVIEFINANCE
```sql
CREATE OR REPLACE FUNCTION add_movie_finance(
    p_movie_id           INT,
    p_production_cost    DECIMAL(15, 2) DEFAULT NULL,
    p_marketing_cost     DECIMAL(15, 2) DEFAULT NULL,
    p_box_office_revenue DECIMAL(15, 2) DEFAULT NULL
) RETURNS MovieFinance AS $$
DECLARE
    v_row MovieFinance;
    v_budget DECIMAL(15, 2);
BEGIN
    SELECT SUM(investment) INTO v_budget FROM Movie_Producer WHERE movie_id = p_movie_id;
    IF v_budget IS NULL THEN
        RAISE EXCEPTION 'Cannot create finance for movie_id=%: no producers assigned', p_movie_id;
    END IF;

    INSERT INTO MovieFinance (movie_id, budget, production_cost, marketing_cost, box_office_revenue)
    VALUES (p_movie_id, v_budget, p_production_cost, p_marketing_cost, p_box_office_revenue)
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
```
---
### DIRECTORFINANCE
```sql
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

```
---
### PRODUCERFINANCE
```sql
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
```
---
### UPDATE PERSON FUNCTIONS
```sql
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
```
---
### UPDATE JUNCTION TABLE FUNCTIONS (RE-ASSIGN)

```sql
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

```
---

### IMPROVED get_movie_full_roster
```sql
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
```
---
## GUI
### actorController
```sql
import sql from '../services/neonClient.js';

export async function addActor(name, birthYear = null, gender = null) {
    const rows = await sql`SELECT * FROM add_actor(${name}, ${birthYear}, ${gender})`;
    return rows[0];
}

export async function removeActor(id) {
    await sql`SELECT remove_actor(${id})`;
}

export async function getAllActors() {
    return sql`SELECT * FROM Actor ORDER BY id`;
}

export async function getActorById(id) {
    const rows = await sql`SELECT * FROM Actor WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieActor(movieId, actorId, role = null, salary = null) {
    await sql`SELECT add_movie_actor(${movieId}, ${actorId}, ${role}, ${salary})`;
}

export async function removeMovieActor(movieId, actorId) {
    await sql`SELECT remove_movie_actor(${movieId}, ${actorId})`;
}

export async function getMoviesByActor(actorName) {
    return sql`SELECT * FROM get_movies_by_actor(${actorName})`;
}

export async function getMoviesByActorId(actorId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre, ma.role, ma.salary
        FROM Movie m
        JOIN Movie_Actor ma ON m.id = ma.movie_id
        WHERE ma.actor_id = ${actorId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}

export async function updateActor(id, name, birthYear = null, gender = null) {
    await sql`SELECT update_actor(${id}, ${name}, ${birthYear}, ${gender})`;
}

export async function updateMovieActor(movieId, actorId, role = null, salary = null) {
    await sql`SELECT update_movie_actor(${movieId}, ${actorId}, ${role}, ${salary})`;
}

```
---
### crewMemberController
```sql
import sql from '../services/neonClient.js';

export async function addCrewMember(name, birthYear = null, gender = null) {
    const rows = await sql`SELECT * FROM add_crew_member(${name}, ${birthYear}, ${gender})`;
    return rows[0];
}

export async function removeCrewMember(id) {
    await sql`SELECT remove_crew_member(${id})`;
}

export async function getAllCrewMembers() {
    return sql`SELECT * FROM CrewMember ORDER BY id`;
}

export async function getCrewMemberById(id) {
    const rows = await sql`SELECT * FROM CrewMember WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieCrewMember(movieId, crewMemberId, jobTitle = null, salary = null) {
    await sql`SELECT add_movie_crew_member(${movieId}, ${crewMemberId}, ${jobTitle}, ${salary})`;
}

export async function removeMovieCrewMember(movieId, crewMemberId) {
    await sql`SELECT remove_movie_crew_member(${movieId}, ${crewMemberId})`;
}

export async function getCrewRoster(movieId) {
    return sql`SELECT * FROM v_crew_roster WHERE movie_id = ${movieId}`;
}

export async function getMoviesByCrewMemberId(crewMemberId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre, mc.job_title, mc.salary
        FROM Movie m
        JOIN Movie_CrewMember mc ON m.id = mc.movie_id
        WHERE mc.crew_member_id = ${crewMemberId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}

export async function updateCrewMember(id, name, birthYear = null, gender = null) {
    await sql`SELECT update_crew_member(${id}, ${name}, ${birthYear}, ${gender})`;
}

export async function updateMovieCrewMember(movieId, crewMemberId, jobTitle = null, salary = null) {
    await sql`SELECT update_movie_crew_member(${movieId}, ${crewMemberId}, ${jobTitle}, ${salary})`;
}

```
---
### directorController
```sql
import sql from '../services/neonClient.js';

export async function addDirector(name, birthYear = null) {
    const rows = await sql`SELECT * FROM add_director(${name}, ${birthYear})`;
    return rows[0];
}

export async function removeDirector(id) {
    await sql`SELECT remove_director(${id})`;
}

export async function getAllDirectors() {
    return sql`SELECT * FROM Director ORDER BY id`;
}

export async function getDirectorById(id) {
    const rows = await sql`SELECT * FROM Director WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieDirector(movieId, directorId) {
    await sql`SELECT add_movie_director(${movieId}, ${directorId})`;
}

export async function removeMovieDirector(movieId, directorId) {
    await sql`SELECT remove_movie_director(${movieId}, ${directorId})`;
}

export async function getDirectorRoi(directorId) {
    const rows = await sql`SELECT * FROM get_director_roi(${directorId})`;
    return rows[0] ?? null;
}

export async function getDirectorFilmography() {
    return sql`SELECT * FROM v_director_filmography ORDER BY movie_count DESC`;
}

export async function getMoviesByDirectorId(directorId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre
        FROM Movie m
        JOIN Movie_Director md ON m.id = md.movie_id
        WHERE md.director_id = ${directorId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}

export async function updateDirector(id, name, birthYear = null) {
    await sql`SELECT update_director(${id}, ${name}, ${birthYear})`;
}

```
---
### financeController
```sql
import sql from '../services/neonClient.js';

// ── MovieFinance ────────────────────────────────────────────────────────────

export async function addMovieFinance(
    movieId,
    productionCost = null,
    marketingCost = null,
    boxOfficeRevenue = null
) {
    const rows = await sql`SELECT * FROM add_movie_finance(
        ${movieId}, ${productionCost}, ${marketingCost}, ${boxOfficeRevenue}
    )`;
    return rows[0];
}

export async function upsertMovieFinance(
    movieId,
    productionCost = null,
    marketingCost = null,
    boxOfficeRevenue = null
) {
    const rows = await sql`
        WITH p AS (SELECT COALESCE(SUM(investment), 0) as budget FROM Movie_Producer WHERE movie_id = ${movieId})
        INSERT INTO MovieFinance (movie_id, budget, production_cost, marketing_cost, box_office_revenue)
        SELECT ${movieId}, p.budget, ${productionCost}, ${marketingCost}, ${boxOfficeRevenue} FROM p
        ON CONFLICT (movie_id) 
        DO UPDATE SET 
            production_cost = EXCLUDED.production_cost,
            marketing_cost = EXCLUDED.marketing_cost,
            box_office_revenue = EXCLUDED.box_office_revenue
        RETURNING *;
    `;
    return rows[0];
}

export async function removeMovieFinance(movieId) {
    await sql`SELECT remove_movie_finance(${movieId})`;
}

export async function getMovieFinance(movieId) {
    const rows = await sql`SELECT * FROM MovieFinance WHERE movie_id = ${movieId}`;
    return rows[0] ?? null;
}

// ── DirectorFinance ─────────────────────────────────────────────────────────

export async function addDirectorFinance(
    directorId,
    movieId,
    baseFee = null,
    commissionRate = null,
    commissionType = null,
    contractType = null,
    bonus = null,
    totalPayout = null
) {
    const rows = await sql`SELECT * FROM add_director_finance(
        ${directorId}, ${movieId}, ${baseFee}, ${commissionRate},
        ${commissionType}, ${contractType}, ${bonus}, ${totalPayout}
    )`;
    return rows[0];
}

export async function removeDirectorFinance(directorId, movieId) {
    await sql`SELECT remove_director_finance(${directorId}, ${movieId})`;
}

export async function getDirectorFinance(directorId, movieId) {
    const rows = await sql`
        SELECT * FROM DirectorFinance
        WHERE director_id = ${directorId} AND movie_id = ${movieId}
    `;
    return rows[0] ?? null;
}

// ── ProducerFinance ─────────────────────────────────────────────────────────

export async function addProducerFinance(
    producerId,
    movieId,
    baseFee = null,
    commissionRate = null,
    commissionType = null,
    contractType = null,
    profitShareRate = null,
    movieNetProfit = null,
    bonus = null,
    totalPayout = null
) {
    const rows = await sql`SELECT * FROM add_producer_finance(
        ${producerId}, ${movieId}, ${baseFee}, ${commissionRate}, ${commissionType},
        ${contractType}, ${profitShareRate}, ${movieNetProfit}, ${bonus}, ${totalPayout}
    )`;
    return rows[0];
}

export async function removeProducerFinance(producerId, movieId) {
    await sql`SELECT remove_producer_finance(${producerId}, ${movieId})`;
}

export async function getProducerFinance(producerId, movieId) {
    const rows = await sql`
        SELECT * FROM ProducerFinance
        WHERE producer_id = ${producerId} AND movie_id = ${movieId}
    `;
    return rows[0] ?? null;
}

```
---
### movieController
```sql
import sql from '../services/neonClient.js';

export async function addMovie(title, genre = null, topic = null, releaseYear = null) {
    const rows = await sql`SELECT * FROM add_movie(${title}, ${genre}, ${topic}, ${releaseYear})`;
    return rows[0];
}

export async function removeMovie(id) {
    await sql`SELECT remove_movie(${id})`;
}

export async function publishMovie(id, title, genre, topic, releaseYear) {
    const rows = await sql`SELECT * FROM publish_movie(${id}, ${title}, ${genre}, ${topic}, ${releaseYear})`;
    return rows[0];
}

export async function getAllMovies() {
    return sql`SELECT * FROM Movie ORDER BY id`;
}

export async function getMovieById(id) {
    const rows = await sql`SELECT * FROM Movie WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function getMovieFullRoster(movieId) {
    return sql`SELECT * FROM get_movie_full_roster(${movieId})`;
}

export async function getMovieTotalSpend(movieId) {
    const rows = await sql`SELECT * FROM get_movie_total_spend(${movieId})`;
    return rows[0] ?? null;
}

export async function flagOverBudgetMovies() {
    return sql`SELECT * FROM flag_over_budget_movies()`;
}

```
---
### producerController
```sql
import sql from '../services/neonClient.js';

export async function addProducer(name, birthYear = null, gender = null) {
    const rows = await sql`SELECT * FROM add_producer(${name}, ${birthYear}, ${gender})`;
    return rows[0];
}

export async function removeProducer(id) {
    await sql`SELECT remove_producer(${id})`;
}

export async function getAllProducers() {
    return sql`SELECT * FROM Producer ORDER BY id`;
}

export async function getProducerById(id) {
    const rows = await sql`SELECT * FROM Producer WHERE id = ${id}`;
    return rows[0] ?? null;
}

export async function addMovieProducer(movieId, producerId, investment) {
    await sql`SELECT add_movie_producer(${movieId}, ${producerId}, ${investment})`;
}

export async function removeMovieProducer(movieId, producerId) {
    await sql`SELECT remove_movie_producer(${movieId}, ${producerId})`;
}

export async function updateMovieProducerInvestment(movieId, producerId, investment) {
    await sql`SELECT update_movie_producer_investment(${movieId}, ${producerId}, ${investment})`;
}

export async function getMoviesByProducerId(producerId) {
    return sql`
        SELECT m.id, m.title, m.release_year, m.genre
        FROM Movie m
        JOIN Movie_Producer mp ON m.id = mp.movie_id
        WHERE mp.producer_id = ${producerId}
        ORDER BY m.release_year DESC NULLS LAST, m.title
    `;
}

export async function updateProducer(id, name, birthYear = null, gender = null) {
    await sql`SELECT update_producer(${id}, ${name}, ${birthYear}, ${gender})`;
}

export async function getMovieProducers(movieId) {
    return sql`
        SELECT p.id, p.name, mp.investment
        FROM Movie_Producer mp
        JOIN Producer p ON p.id = mp.producer_id
        WHERE mp.movie_id = ${movieId}
        ORDER BY p.name
    `;
}

```
---

### queryController
```sql
import sql from '../services/neonClient.js';

export async function getProfitableMovies() {
    return sql`SELECT * FROM v_profitable_movies`;
}

export async function getMovieFullCast(movieId) {
    return sql`SELECT * FROM v_movie_full_cast WHERE movie_id = ${movieId}`;
}

export async function getDirectorFilmography() {
    return sql`SELECT * FROM v_director_filmography ORDER BY movie_count DESC`;
}

export async function getTopPaidActors(limit = 10) {
    return sql`SELECT * FROM v_top_paid_actors LIMIT ${limit}`;
}

export async function getGenrePerformance() {
    return sql`SELECT * FROM v_genre_performance`;
}

export async function getCrewRoster(movieId = null) {
    if (movieId !== null) {
        return sql`SELECT * FROM v_crew_roster WHERE movie_id = ${movieId}`;
    }
    return sql`SELECT * FROM v_crew_roster`;
}

export async function getMovieFinancialOverview(movieId = null) {
    if (movieId !== null) {
        return sql`SELECT * FROM v_movie_financial_overview WHERE movie_id = ${movieId}`;
    }
    return sql`SELECT * FROM v_movie_financial_overview ORDER BY roi_pct DESC NULLS LAST`;
}

export async function getMostProfitableGenre() {
    const rows = await sql`SELECT * FROM get_most_profitable_genre()`;
    return rows[0] ?? null;
}

export async function getMoviesByActor(actorName) {
    return sql`SELECT * FROM get_movies_by_actor(${actorName})`;
}

export async function getDirectorRoi(directorId) {
    const rows = await sql`SELECT * FROM get_director_roi(${directorId})`;
    return rows[0] ?? null;
}

export async function flagOverBudgetMovies() {
    return sql`SELECT * FROM flag_over_budget_movies()`;
}

```
---
## 📘 **13 Complex SQL Queries (Film Production Database Management System)**


## VIEWS

---
### 1. Full financial overview per movie (ROI included)
```sql
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
```
---

### 2. Full cast per movie (actors with roles and salaries)
```sql
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
```
---

### 3. Director filmography with movie count and average budget
```sql
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
```
---

### 4. Actors ranked by total earnings across all movies
```sql
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
```
---

### 5. Genre-level aggregated financial performance
```sql
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
```
---

### 6. Full crew roster per movie
```sql
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
```
---

### 7. Profitable movies ranked by net profit
```sql
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
```
---


## PL/pgSQL STORED FUNCTIONS


### 1. Total spend for a movie: all actor + crew salaries + production + marketing costs
```sql
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
```
---

### 2. Everyone involved in a movie (actors, crew, directors, producers)
```sql
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
```
---

### 3. Find movies by actor name (partial, case-insensitive)
```sql
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
```
---

### 4. Genre with the highest average net profit
```sql
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
```
---

### 5. Movies where production_cost exceeded the approved budget
```sql
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
```
---

### 6. Average ROI across all movies directed by a given director
```sql
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
```
---
