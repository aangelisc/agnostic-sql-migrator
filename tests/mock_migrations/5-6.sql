CREATE TABLE "digital" (
    product VARCHAR,
    cost_exc_vat MONEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
