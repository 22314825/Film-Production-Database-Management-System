-- Movie <-> Actor
-- role and salary live here because actors are paid per movie, not globally
CREATE TABLE Movie_Actor
(
    movie_id  INT          NOT NULL REFERENCES Movie(id)  ON DELETE CASCADE,
    actor_id  INT          NOT NULL REFERENCES Actor(id)  ON DELETE CASCADE,
    role      VARCHAR(100),
    salary    DECIMAL(15, 2),
    PRIMARY KEY (movie_id, actor_id)
);


-- Movie <-> CrewMember
-- job_title and salary live here because crew are hired per movie, not globally
CREATE TABLE Movie_CrewMember
(
    movie_id       INT          NOT NULL REFERENCES Movie(id)       ON DELETE CASCADE,
    crew_member_id INT          NOT NULL REFERENCES CrewMember(id)  ON DELETE CASCADE,
    job_title      VARCHAR(100),
    salary         DECIMAL(15, 2),
    PRIMARY KEY (movie_id, crew_member_id)
);

-- Movie <-> Director
CREATE TABLE Movie_Director
(
    movie_id    INT NOT NULL REFERENCES Movie(id)    ON DELETE CASCADE,
    director_id INT NOT NULL REFERENCES Director(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, director_id)
);

-- Movie <-> Producer
CREATE TABLE Movie_Producer
(
    movie_id    INT NOT NULL REFERENCES Movie(id)    ON DELETE CASCADE,
    producer_id INT NOT NULL REFERENCES Producer(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, producer_id)
);
