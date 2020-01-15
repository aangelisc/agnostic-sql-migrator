CREATE SEQUENCE sequences.quote_ref START WITH 00000001

CREATE TABLE "quotes"
(
    quote_ref int DEFAULT NEXT VALUE FOR sequences.quote_ref PRIMARY KEY,
    created_at date DEFAULT getdate()
)