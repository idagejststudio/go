# GO på VPS

GO kører som én Docker Compose-service. Node-serveren leverer både de statiske
prototyper og `/api/*`; Caddy sender `go.demo.gejststudio.com` videre til
`go-prototype:8787` på det eksisterende interne `web`-netværk.

## Udrulning

På VPS'en ligger projektet i `/opt/go-prototype`. Efter at koden er opdateret:

```bash
cd /opt/go-prototype
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 go
```

Containeren åbner ingen offentlig port. Caddy-ruten er:

```caddyfile
go.demo.gejststudio.com {
    reverse_proxy go-prototype:8787
}
```

Kontrollér `https://go.demo.gejststudio.com/api/health`, forsiden og mindst
én katalogsøgning efter hver udrulning. Browseren installeres under Docker-build;
der bruges kun Playwrights Chromium headless shell.
