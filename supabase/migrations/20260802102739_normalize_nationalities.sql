-- Normalise nationality demonyms to country names on employees, so the
-- values match the country list used across the app (filters, reports).
update public.employees set nationality = case upper(trim(nationality))
  when 'INDIAN'      then 'INDIA'
  when 'NEPALI'      then 'NEPAL'
  when 'NEPALESE'    then 'NEPAL'
  when 'SRI LANKAN'  then 'SRI LANKA'
  when 'SRILANKAN'   then 'SRI LANKA'
  when 'BANGLADESHI' then 'BANGLADESH'
  when 'PAKISTANI'   then 'PAKISTAN'
  when 'FILIPINO'    then 'PHILIPPINES'
  when 'FILIPINA'    then 'PHILIPPINES'
  when 'PHILIPPINE'  then 'PHILIPPINES'
  when 'PHILIPINO'   then 'PHILIPPINES'
  when 'MALAYSIAN'   then 'MALAYSIA'
  when 'MALDIVIAN'   then 'MALDIVES'
  when 'BURMESE'     then 'MYANMAR'
  when 'MYANMARESE'  then 'MYANMAR'
  when 'FINNISH'     then 'FINLAND'
  else nationality end
where upper(trim(nationality)) in
  ('INDIAN','NEPALI','NEPALESE','SRI LANKAN','SRILANKAN','BANGLADESHI','PAKISTANI',
   'FILIPINO','FILIPINA','PHILIPPINE','PHILIPINO','MALAYSIAN','MALDIVIAN','BURMESE','MYANMARESE','FINNISH');
