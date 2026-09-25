# Find noget ligesom

En selvstændig, interaktiv konceptprototype for eReolen GO!: vælg en bog, vælg hvad man kunne lide ved den, og få tre bogforslag med en personlig forklaring.

Åbn `index.html` via en lokal webserver. Siden genbruger stylesheet, farvetokens, DM Sans, ikoner og bogforsider fra `../design-system-reference/`. Bogkatalog og anbefalinger er demoindhold uden backend.

Flow: bogsøgning/populære valg → præferenceknapper (flere valg) → anbefalinger. På resultatsiden sammensættes teksten automatisk ud fra bog og valgte præferencer; forslag kan gemmes med hjerteknappen. “Prøv igen” nulstiller flowet. Luk-knappen skjuler dialogen, og “Find noget ligesom” ved pilene under “Bøger jeg har lånt” åbner den igen.
