-- The football title is shown without its yearly version number ("EA SPORTS FC").
-- Only applies while the name is still the original seed value.
update zenith.games set name = 'EA SPORTS FC', short_name = 'FC' where id = 'ea-fc-26' and name = 'EA SPORTS FC 26';
