# Hvilken bogtype er du?

Den interaktive quiz giver en læsepersona og viser to dynamiske boghylder fra
den aktuelle bogsamling. Hver persona har to redaktionelt definerede
opdagelsesretninger (fx fantasy og eventyr for Fantasten), men titler, forsider,
forfattere, formater og værklinks kommer fra den aktuelle katalogsøgning.

## Start

Start først adapteren fra projektroden:

```bash
cd go-api
npm start
```

Åbn derefter `bogtype-test/index.html` via en lokal webserver eller direkte i
browseren. Resultatsiden kalder `http://localhost:8787/api/bogtype`.

Hvis adapteren ikke kører eller bogsamlingen er midlertidigt utilgængelig,
bevarer testen oplevelsen med tydeligt mærkede lokale fallback-forslag.
