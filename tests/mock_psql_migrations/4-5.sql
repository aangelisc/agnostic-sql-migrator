CREATE TABLE "promotions" (
    promotion_title VARCHAR,
    promotion_subtitle VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expiry_date DATE
);