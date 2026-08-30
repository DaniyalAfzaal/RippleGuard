-- ------------------------------------------------------------------
-- CUSTQRY - customer credit reporting view
-- Used by the monthly credit report. Key column is CUSID CHAR(9).
-- ------------------------------------------------------------------

CREATE OR REPLACE VIEW CUSTCREDIT_V AS
SELECT CAST(C.CUSID AS CHAR(9))  AS CUSTOMER_KEY,
       C.CUSNAM                  AS CUSTOMER_NAME,
       C.CUSREG                  AS REGION,
       C.CUSCRD                  AS CREDIT_LIMIT
FROM   CUSMAS C
WHERE  C.CUSCRD > 0;
