-- CUSTORD_V: reporting view joining customers to their orders.
-- CHG-1042: Removed SUBSTR(CUSTOMER_ID, 1, 9) / CAST(AS CHAR(9)) truncation.
--           CUSTOMER_ID is now CHAR(12); no substring guard needed.

CREATE OR REPLACE VIEW CUSTORD_V AS
SELECT C.CUSTOMER_ID AS CUSTOMER_KEY,
       C.CUST_NAME,
       C.CUST_REGION,
       O.ORDER_NO,
       O.ORDER_AMT,
       O.ORDER_STAT,
       O.STATUS_DATE
FROM   CUSMAS C
JOIN   ORDMAS O
       ON O.CUSTOMER_ID = C.CUSTOMER_ID;
