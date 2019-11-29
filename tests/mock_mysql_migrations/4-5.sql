CREATE TABLE promotions (
    promotion_title VARCHAR(255),
    promotion_subtitle VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    expiry_date DATE
);