-- Enums for contract classification (shared by DirectorFinance and ProducerFinance)
CREATE TYPE commission_type AS ENUM ('gross', 'net', 'backend');
CREATE TYPE contract_type   AS ENUM ('flat', 'percentage', 'hybrid');

-- Movie financial overview
CREATE TABLE MovieFinance
(
    id                 SERIAL PRIMARY KEY,
    movie_id           INT           NOT NULL UNIQUE REFERENCES Movie(id) ON DELETE CASCADE,
    budget             DECIMAL(15, 2),
    production_cost    DECIMAL(15, 2),
    marketing_cost     DECIMAL(15, 2),
    box_office_revenue DECIMAL(15, 2),
    -- auto-derived: revenue minus all costs
    net_profit         DECIMAL(15, 2) GENERATED ALWAYS AS (box_office_revenue - production_cost - marketing_cost) STORED
);


-- Director financial agreement per movie
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

-- Producer financial agreement per movie
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