CREATE TABLE Movie (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    topic VARCHAR(100),
    release_year INT,
    status VARCHAR(20) DEFAULT 'draft'
);

CREATE TABLE Producer
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT,
    gender VARCHAR(10)
);

CREATE TABLE Director
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT
);


CREATE TABLE Actor
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT, 
    gender VARCHAR(10)
    -- role VARCHAR(100),
    -- salary DECIMAL(15)
);

CREATE TABLE CrewMember
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT,
    gender VARCHAR(10)
    -- job_title VARCHAR(100),
    -- salary DECIMAL(15)
);