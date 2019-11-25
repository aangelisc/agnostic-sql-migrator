CREATE TABLE "terms_and_conditions" (
    onerow_id boolean DEFAULT TRUE PRIMARY KEY,
    terms_and_conditions_text VARCHAR DEFAULT NULL,
    CONSTRAINT onerow_uni CHECK (onerow_id)
);

INSERT INTO "terms_and_conditions" ("terms_and_conditions_text")
VALUES (NULL);