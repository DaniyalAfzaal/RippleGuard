**free
ctl-opt dftactgrp(*no) actgrp(*new) option(*srcstmt:*nodebugio);

// ---------------------------------------------------------------
// CUSMNT - Customer master maintenance
// Chains CUSMAS by customer key, validates format, updates name.
// Key format: AAA999999 (3 alpha + 6 digits, CHAR 9).
// ---------------------------------------------------------------

dcl-f CUSMAS usage(*update:*output) keyed;

/copy qrpgleref,CUSTREC

dcl-c CUSID_LEN 9;

dcl-pi CUSMNT;
  inCusId char(9) const;
  inName  char(20) const;
  outRc   char(1);
end-pi;

dcl-s wkKey char(9);

// Reject keys that are not exactly CUSID_LEN characters
if %len(%trim(inCusId)) <> CUSID_LEN;
  outRc = 'E';
  return;
endif;

// Alpha prefix + numeric suffix check
if %subst(inCusId:1:3) < 'AAA' or %subst(inCusId:1:3) > 'ZZZ';
  outRc = 'E';
  return;
endif;

wkKey = inCusId;
chain (wkKey) CUSMAS;

if %found(CUSMAS);
  CUSNAM = inName;
  update CUSREC;
  outRc = 'U';
else;
  CUSID  = wkKey;
  CUSNAM = inName;
  CUSREG = '   ';
  CUSCRD = 0;
  write CUSREC;
  outRc = 'A';
endif;

return;
