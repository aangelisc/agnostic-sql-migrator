CREATE SEQUENCE "quote_ref" START 00000001;

CREATE TABLE IF NOT EXISTS "quotes"
(
    quote_ref int DEFAULT nextval('quote_ref') PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);