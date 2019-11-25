CREATE TABLE "discounts" (
    onerow_id boolean DEFAULT TRUE PRIMARY KEY,
    second_discount DECIMAL,
    third_discount DECIMAL,
    fourth_discount DECIMAL,
    fifth_discount DECIMAL,
    max_discounts INT,
    CONSTRAINT onerow_uni CHECK (onerow_id)
);

INSERT INTO "discounts" ("second_discount", "third_discount", "fourth_discount", "fifth_discount", "max_discounts")
VALUES (NULL, NULL, NULL, NULL, NULL);