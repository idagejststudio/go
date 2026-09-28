# “Ved ikke” som legitim søgestrategi

Interaktiv prototype til eReolen GO!, hvor “Jeg ved det ikke” er indgangen til en skør, kort quiz i stedet for et traditionelt søgefelt.

Start først dataadapteren i `../go-api/` med `npm start`, og åbn derefter `index.html` fra en lokal webserver. Quizzen vægter svar mod fem læsespor — spænding, mysterie, fantasi, humor og hygge — og henter relevante hylder direkte fra det offentlige eReolen GO!-katalog via `/api/bogtype`.

Resultatet viser en sikker start og to kataloghylder med aktuelle titler, rigtige forsider, format og links til værkerne på GO!. Hvis kataloget ikke er tilgængeligt, vises et lille lokalt nødsæt, så flowet stadig kan afprøves.
