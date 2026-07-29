-- Normalise the demonym "BANGLADESHI" to the country value "BANGLADESH"
-- used by the Add-Employee nationality dropdown, so the employees
-- nationality filter no longer shows two separate entries.
update public.employees
   set nationality = 'BANGLADESH'
 where upper(trim(nationality)) = 'BANGLADESHI';
