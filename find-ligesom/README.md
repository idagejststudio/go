# Find noget ligesom

En interaktiv konceptprototype for eReolen GO!: søg efter en e-bog eller lydbog i det offentlige GO-katalog, vælg hvad man kunne lide, og få forslag fra GO's katalog med aldersfiltrene 10–13 år.

Start dataadapteren i `../go-api/` (`npm start`) og åbn derefter `index.html` via en lokal webserver. Adapteren søger i Københavns offentlige GO-site og viser kun e-bøger og online-lydbøger. Søgeforslag og anbefalinger indeholder de live katalogoplysninger og forsidebilleder; forslag linker til det relevante værk hos GO.

Flow: live værksøgning eller emnevalg → op til tre præferencer → katalogbaserede forslag. Forslagene hentes i baggrunden, når præferencerne vælges, og genbruges på resultatsiden. GO's emnesøgning og aldersfiltre finder kandidaterne; den valgte bogs oplysninger bruges til at undgå samme bog og supplere med dens genre. “Prøv igen” nulstiller flowet. Luk-knappen skjuler dialogen, og “Find noget ligesom” ved pilene under “Bøger jeg har lånt” åbner den igen.
