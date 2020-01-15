CREATE TABLE "discounts" (
    onerow_id BIT DEFAULT 1 PRIMARY KEY,
    second_discount DECIMAL,
    third_discount DECIMAL,
    fourth_discount DECIMAL,
    fifth_discount DECIMAL,
    max_discounts INT
)

INSERT INTO "discounts" ("second_discount", "third_discount", "fourth_discount", "fifth_discount", "max_discounts")
VALUES (NULL, NULL, NULL, NULL, NULL)