-- CUSMAS: customer master
-- Ported from the IBM i physical file of the same name.
-- CHG-1042: CUSTOMER_ID widened from CHAR(9) to CHAR(12).
--           CHECK pattern now accepts both 9-char (AAA999999) and
--           12-char (AAA999999999) formats during the transition period.

CREATE TABLE CUSMAS (
    CUSTOMER_ID   CHAR(12)     NOT NULL,
    CUST_NAME     VARCHAR(20)  NOT NULL,
    CUST_REGION   CHAR(3),
    CREDIT_LIMIT  DECIMAL(8,2) DEFAULT 0,
    CONSTRAINT PK_CUSMAS PRIMARY KEY (CUSTOMER_ID),
    CONSTRAINT CK_CUSTOMER_ID_FMT
        CHECK (CUSTOMER_ID LIKE
               '____________' ESCAPE '\')  -- 12 positions, format AAA999999 or AAA999999999
);
