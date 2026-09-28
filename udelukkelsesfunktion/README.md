# Find ved at fravælge

Åbn `index.html` i denne mappe for den selvstændige eReolen GO!-funktion.

Forløb: introduktion → fravælg tre bøger → fravælg tre nye bøger → vælg til/fra efter sidetal → se fælles temaer og vælg bog eller få flere beslægtede forslag.

Funktionen bruger nu den lokale GO-adapter i `../go-api/` til at hente titler, forfattere, forsider, formater, alder, emneord, genre og sidetal fra eReolen GO. Start adapteren med `cd ../go-api && npm start`, før prototypen åbnes. De bøger, barnet beholder, bruges som signaler til at finde den næste bunke; “Vis mig flere bøger” bevarer samtidig de aktuelle match som gemte bøger.
