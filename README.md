# ISOF-data-tools

Samlingar av verktyg för att hantera ISOF data.

## csvToJson
Verktyg för att konvertera CSV-fil till JSON.

`node csvToJson [input.csv] [output.json]` converterar `input.csv` till `output.json`. Det använder första linjen i CSV-filen för att bestämma definera fälten.

### Exempel
CSV fil med följande innehåll:
```csv
"Acc","Acc_nr_ny","Titel_Allt","Anm_Allt","Inl_from","Landsk_AccOrt_Landsk_Landskap","Socken_AccOrt_Sock_Socken","AccOrt_By_anteckn","Pers_PersId","Pers_Namn","Pers_Kön","Pers_Född","AccPers_Roll"
243797,"s03920:a","Personalia. Skola.",,,"Småland","Rydaholm",,115071,"Frid, Rolf","M",,"1 = INTERVJUARE"
243798,"s03919:b","Skola m.m.",,,"Småland","Rydaholm",,115071,"Frid, Rolf","M",,1
```

...konverteras till

```json
[
  {
    "Acc": "243797",
    "Acc_nr_ny": "s03920:a",
    "Titel_Allt": "Personalia. Skola.",
    "Anm_Allt": "",
    "Inl_from": "",
    "Landsk_AccOrt_Landsk_Landskap": "Småland",
    "Socken_AccOrt_Sock_Socken": "Rydaholm",
    "AccOrt_By_anteckn": "",
    "Pers_PersId": "115071",
    "Pers_Namn": "Frid",
    "Pers_Kön": " Rolf",
    "Pers_Född": "M",
    "AccPers_Roll": ""
  },
  {
    "Acc": "243798",
    "Acc_nr_ny": "s03919:b",
    "Titel_Allt": "Skola m.m.",
    "Anm_Allt": "",
    "Inl_from": "",
    "Landsk_AccOrt_Landsk_Landskap": "Småland",
    "Socken_AccOrt_Sock_Socken": "Rydaholm",
    "AccOrt_By_anteckn": "",
    "Pers_PersId": "115071",
    "Pers_Namn": "Frid",
    "Pers_Kön": " Rolf",
    "Pers_Född": "M",
    "AccPers_Roll": ""
  }
]
```

## jsonToCsv
Verktyg för att konvertera JSON-fil till CSV.

`node jsonToCsv [input.json] [output.csv]` converterar `input.json` (som innehåller array) till `output.csv`.

## jsonGetSocken
Verktyg för att hämta socken ID och lägga till en JSON fil. Den användar socken namn fält och landskap/län fält i JSON data för att hitta ID:et och behöver koppla direkt till svenska_sagor databasen (på localhost).

`node jsonInsertSockenID.js [input json file] [output json file] [landskap field] [socken field] [write not-found report (true|false)]`

### Exempel
`node jsonGetSocken.js input\data.json output\data-with-sockenid.json "Landsk AccOrt_Landsk::Landskap" "Socken AccOrt_Sock::Socken" true` hämtar socken ID för följande JSON fil:

```json
[
  {
    "!Acc": "221685",
    "Acc_nr_ny": "VFF02209",
    "Titel_Allt": "Fotografi.",
    "Inl_from": "",
    "Form Acc_Alla::Omfång": "",
    "Land AccOrt::Land": "Sverige",
    "Landsk AccOrt_Landsk::Landskap": "Småland",
    "Socken AccOrt_Sock::Socken": "Sandsjö, Norra"
  }
]
```

...och skriver ny fil med socken ID för Norra Sandsjö socken:

```json
[
  {
    "!Acc": "221685",
    "Acc_nr_ny": "VFF02209",
    "Titel_Allt": "Fotografi.",
    "Inl_from": "",
    "Form Acc_Alla::Omfång": "",
    "Land AccOrt::Land": "Sverige",
    "Landsk AccOrt_Landsk::Landskap": "Småland",
    "Socken AccOrt_Sock::Socken": "Sandsjö, Norra",
    "socken": {
      "id": 527,
      "name": "Norra Sandsjö sn",
      "location": {
        "lat": 57.466991,
        "lon": 14.766099
      },
      "harad": "Västra hd",
      "harad_id": 104,
      "landskap": "Småland",
      "county": "Jönköpings län",
      "lm_id": "0638"
    }
  }
]
```

