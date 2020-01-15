CREATE TABLE "terms_and_conditions" (
    onerow_id BIT DEFAULT 1 PRIMARY KEY,
    terms_and_conditions_text VARCHAR DEFAULT NULL
)

INSERT INTO "terms_and_conditions" ("terms_and_conditions_text")
VALUES (NULL)