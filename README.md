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
