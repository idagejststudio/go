# Husk din huskeliste

Interaktiv featureprototype til eReolen GO!, som bruger den fælles GO-adapter i `../go-api/`:

- GO! henter aktuelle titler, forfattere, forsider, formater og værklinks fra det offentlige GO-katalog.
- En eksempel-huskeliste med seks eksisterende GO-værker hentes fra kataloget med korrekte metadata.
- Der vises altid kun ét værk ad gangen. Et tilfældigt værk vælges ved hver genindlæsning, og barnet kan vælge “Vis mig en anden fra min liste”.
- Den viste bog kan flyttes til f.eks. sommerferien.

Start adapteren med `cd ../go-api && npm start`, og åbn derefter `index.html` fra en lokal webserver. Adapteren bruger port 8787 som standard. Til test mod en anden lokal port kan URL'en få `?api=http://localhost:8790/api`.

Den anonyme adapter har ikke adgang til et barns rigtige brugerprofil. Derfor bruger prototypen en fast eksempel-huskeliste med rigtige GO-værk-id'er; i en rigtig GO!-integration skal den erstattes af den autentificerede profils huskeliste og påmindelser.
