# Hinweise zur Probeaufgabe

Dieses Dokument ergänzt die technische Dokumentation um die gewünschte
Aufwandschätzung, ein kurzes Aufgabenfeedback und Überlegungen zu den optionalen
Fragestellungen.

## Abdeckung der Anforderungen

| Anforderung                                        | Umsetzung                                                                                                                                   | Dokumentation                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Import der Kölner JSON-Daten in eine SQL-Datenbank | Express/Node.js-Importjob mit PostgreSQL und PostGIS                                                                                        | [Datenimport](../backend/docs/station-import.md)       |
| Aktualität der Daten                               | Wiederholbarer Import mit Upsert, Importhistorie und sicherer Deaktivierung fehlender Datensätze; tägliche Ausführung als Betriebsvorschlag | [Datenimport](../backend/docs/station-import.md)       |
| Vollständige Tankstellenliste                      | `GET /api/stations` ohne Filter                                                                                                             | [API-Referenz](../backend/docs/station-api.md)         |
| Umkreisfilter um eine frei wählbare Position       | Validierte Koordinaten mit 2, 5 oder 10 km Radius über PostGIS                                                                              | [API-Referenz](../backend/docs/station-api.md)         |
| Vue.js-Frontend                                    | Listenansicht mit Lade-, Leer- und Fehlerzuständen                                                                                          | [Frontend-Liste](../frontend/docs/station-list.md)     |
| Suche nach Straßennamen                            | Groß-/kleinschreibungsunabhängige Teiltextsuche                                                                                             | [Frontend-Filter](../frontend/docs/station-filters.md) |
| Auf- und absteigende Sortierung                    | Adresssortierung A–Z und Z–A                                                                                                                | [Frontend-Filter](../frontend/docs/station-filters.md) |
| Zusätzliche Entfernungssortierung                  | Nächste oder weiteste Tankstelle zuerst innerhalb des gewählten Radius                                                                      | [Frontend-Filter](../frontend/docs/station-filters.md) |
| Quellcode und lokale Ausführung                    | Vollständiges Repository mit Installations-, Start- und Testanleitung                                                                       | [README](../README.md)                                 |
| Kollaboration und Codequalität                     | Feature-Branches, CI, Tests, TypeScript, Zod, Logging und weitere Vorschläge                                                                | Abschnitt „Kollaborative Entwicklung und Codequalität“ |
| CRUD-Erweiterung                                   | Konzept für manuelle und importierte Datensätze, Schreibendpunkte, Rechte und Auditierung                                                   | Abschnitt „Erweiterung zu einer CRUD-Anwendung“        |
| Hosting                                            | Konzept für Frontend, Express-Service, PostGIS und geplanten Importjob                                                                      | Abschnitt „Hosting und Betrieb“                        |

## Aufwandschätzung

Für die vorliegende Umsetzung würde ich mit insgesamt **12 bis 17 Stunden**
rechnen:

| Bereich                                                                |   Schätzung |
| ---------------------------------------------------------------------- | ----------: |
| Analyse, Projektaufbau und Datenmodell                                 | 1–2 Stunden |
| PostgreSQL/PostGIS, Migrationen und Datenimport                        | 3–4 Stunden |
| Express-Endpoint, Validierung und räumliche Filter                     | 2–3 Stunden |
| Vue-Oberfläche, Suche, Adress-/Entfernungssortierung und Umkreisfilter | 3–4 Stunden |
| Tests, CI, Logging und Dokumentation                                   | 3–4 Stunden |

Die Schätzung umfasst eine reviewfähige Lösung mit Fehlerbehandlung und Tests,
nicht nur einen funktionalen Prototyp. Eine interaktive Karte wäre eine
zusätzliche Ausbaustufe und ist nicht Teil dieser Schätzung.

## Feedback zur Aufgabe

Die Aufgabe ist praxisnah, weil sie Datenintegration, Datenmodellierung,
API-Design und Frontend-Zustände in einem überschaubaren fachlichen Kontext
verbindet. Besonders sinnvoll ist die offene Frage zur Aktualität der Daten:
Sie macht sichtbar, ob neben dem einmaligen Import auch Fehlerfälle,
Wiederholbarkeit und Betrieb berücksichtigt werden.

Für eine noch eindeutigere Aufwandsschätzung könnten folgende Punkte vorab
konkretisiert werden:

- In welchem Intervall sollen die Quelldaten aktualisiert werden?
- Bedeutet „frei wählbare Position“ Koordinateneingabe, Browserstandort,
  Adresssuche oder Kartenauswahl?
- Wird eine konkrete SQL-Datenbank oder Zielplattform bevorzugt?
- Welcher Umfang wird bei den optionalen Punkten als Implementierung und welcher
  nur als Konzept erwartet?

Die Lösung trifft dafür dokumentierte Annahmen: tägliche Synchronisierung als
sinnvoller Ausgangspunkt, editierbare Koordinaten mit optionaler
Browser-Geolocation und PostgreSQL/PostGIS für korrekte Umkreisabfragen.
Innerhalb eines gewählten Umkreises lassen sich die Ergebnisse sowohl nach
Adresse als auch nach Entfernung auf- beziehungsweise absteigend sortieren.

## Kollaborative Entwicklung und Codequalität

Im Projekt bereits umgesetzt sind:

- Kleine Feature-Branches und reviewbare Commits
- Pull-Request-Checks mit GitHub Actions
- Getrennte Backend- und Frontend-Jobs
- TypeScript mit strikter Typprüfung
- Automatisierte Backend- und Frontend-Tests
- Zod-Validierung an externen und öffentlichen Eingabegrenzen
- Versionierte, transaktionale Datenbankmigrationen
- Strukturierte Logs mit Request-IDs
- Fachliche Dokumentation nahe am jeweiligen Projektteil

Für ein größeres Team wären zusätzlich sinnvoll:

- Geschützter `main`-Branch mit verpflichtendem Review und erfolgreichen Checks
- Automatische Formatierungs- und Lint-Prüfungen
- Automatisierte Dependency- und Security-Updates
- Eine Pull-Request-Vorlage mit Test- und Migrationshinweisen
- Preview-Deployments für Frontend-Änderungen

## Erweiterung zu einer CRUD-Anwendung

Eine CRUD-Erweiterung sollte zuerst klären, wem ein Datensatz gehört. Direktes
Bearbeiten importierter Quelldaten wäre problematisch, weil der nächste Import
lokale Änderungen wieder überschreiben könnte.

Ein mögliches Modell wäre:

1. `stations` erhält eine Herkunft, beispielsweise `source_type` mit
   `cologne_open_data` oder `manual`.
2. `external_id` bleibt für importierte Datensätze eindeutig und darf für
   manuelle Datensätze leer sein.
3. Für manuelle Datensätze entstehen `POST /api/stations`,
   `PATCH /api/stations/:id` und `DELETE /api/stations/:id`.
4. Importierte Datensätze sind nur lesbar oder erhalten getrennte lokale
   Ergänzungsfelder, die der Import nicht verändert.
5. Löschen erfolgt zunächst als Soft Delete, damit Historie und Referenzen
   erhalten bleiben.

Ergänzend wären Authentifizierung, rollenbasierte Autorisierung,
Änderungsprotokolle, Konfliktbehandlung per Versionsfeld sowie Zod-Schemas für
Schreiboperationen erforderlich. Das Frontend bekäme Formularansichten mit
Feldvalidierung und bestätigungspflichtigen Löschaktionen.

## Hosting und Betrieb

Eine einfache produktive Architektur könnte so aussehen:

```text
Browser
   |
CDN / statisches Vue-Frontend
   |
HTTPS / Reverse Proxy
   |
Express-Container
   |
Managed PostgreSQL mit PostGIS

Scheduler ---> separater Import-Job ---> PostgreSQL
```

Ein konkretes Referenzdeployment ließe sich beispielsweise vollständig auf
[Render](https://render.com/) abbilden:

| Komponente | Render-Dienst | Konfiguration |
| --- | --- | --- |
| Vue-Frontend | [Static Site](https://render.com/docs/static-sites) | Root-Verzeichnis `frontend`, Build `npm ci && npm run build`, Publish-Verzeichnis `dist` |
| Express-API | [Web Service](https://render.com/docs/web-services) | Root-Verzeichnis `backend`, Build `npm ci && npm run build`, Start `npm start`, Health Check `/api/health` |
| Datenbank | [Render Postgres](https://render.com/docs/postgresql) | Interne `DATABASE_URL`; die Migration aktiviert die unterstützten Erweiterungen PostGIS und `pg_trgm` |
| Datenimport | [Cron Job](https://render.com/docs/cronjobs) | Root-Verzeichnis `backend`, Build wie die API, Zeitplan `0 3 * * *` (täglich 03:00 Uhr UTC), Kommando `npm run stations:import:prod` |

Vor dem Start einer neuen API-Version wird einmalig
`npm run db:migrate:prod` als Pre-Deploy-Schritt ausgeführt. Der Cron Job und
die API verwenden dieselbe `DATABASE_URL` und dieselben nicht öffentlichen
Konfigurationswerte. Eine Rewrite-Regel der Static Site leitet `/api/*` an die
öffentliche URL des Web Service weiter, sodass das Frontend weiterhin relative
API-Pfade verwenden kann.

Ein fehlgeschlagener Import sollte einmal zeitversetzt wiederholt und
anschließend alarmiert werden; Status und Zähler bleiben zusätzlich in
`station_import_runs` nachvollziehbar. Anbieterunabhängig sind außerdem
folgende Betriebsmaßnahmen sinnvoll:

- Secrets ausschließlich über die Hosting-Plattform verwalten
- HTTPS erzwingen und CORS auf die tatsächliche Frontend-Origin beschränken
- Datenbankverbindungen und Timeouts auf die Plattformgrenzen abstimmen
- Strukturierte Logs zentral sammeln und Fehler alarmieren
- Datenbank-Backups und Wiederherstellung regelmäßig testen
- Health Check, Importhistorie und Alter des letzten erfolgreichen Imports
  überwachen

Das lokale `docker-compose.yml` dient der Entwicklung und ist keine vollständige
Produktionskonfiguration.

## Bewusste Abgrenzungen

- Eine Karte ist für die geforderte Listenansicht nicht notwendig.
- Ein globaler Vue Store wäre bei einer einzelnen Seite ohne geteilten
  Routenzustand zusätzliche Komplexität.
- Die API ist in Markdown dokumentiert; Swagger UI ist bei einem fachlichen
  Endpoint optional.
- Rohkoordinaten werden nicht als Nutzerinformation angezeigt, bleiben aber für
  Umkreisberechnung und spätere Kartenfunktionen im Datenmodell erhalten.
