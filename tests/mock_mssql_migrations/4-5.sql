CREATE TABLE "promotions" (
    promotion_title VARCHAR,
    promotion_subtitle VARCHAR,
    created_at DATE DEFAULT getdate(),
    expiry_date DATE
)