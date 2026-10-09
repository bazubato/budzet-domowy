import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Tag, Pencil, Check,
  Wallet, CalendarDays, Crown, Flame, Settings2, Download, Upload,
  ChevronUp, ChevronDown,
} from "lucide-react";

const MIESIACE = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const PALETA = [
  "#2E6F9E", "#7A5CA8", "#C97A2B", "#3F7D4F",
  "#B14A6B", "#4C7A6E", "#B15C2E", "#5B5F8A",
];

const DOMYSLNE_KATEGORIE_WYDATKOW = [
  { id: "k1", nazwa: "Jedzenie", limit: 800, kolor: PALETA[0], typ: "wydatek" },
  { id: "k2", nazwa: "Mieszkanie", limit: 1500, kolor: PALETA[1], typ: "wydatek" },
  { id: "k3", nazwa: "Transport", limit: 400, kolor: PALETA[2], typ: "wydatek" },
  { id: "k4", nazwa: "Rozrywka", limit: 300, kolor: PALETA[3], typ: "wydatek" },
  { id: "k5", nazwa: "Zdrowie", limit: 200, kolor: PALETA[4], typ: "wydatek" },
  { id: "k6", nazwa: "Oszczędności", limit: null, kolor: PALETA[5], typ: "wydatek" },
];

const DOMYSLNE_KATEGORIE_WPLYWOW = [
  { id: "w1", nazwa: "Wynagrodzenie", limit: null, kolor: PALETA[6], typ: "wplyw" },
  { id: "w2", nazwa: "Dodatkowy dochód", limit: null, kolor: PALETA[7], typ: "wplyw" },
  { id: "w3", nazwa: "Inne wpływy", limit: null, kolor: "#1F8A8A", typ: "wplyw" },
];

const DOMYSLNE_KATEGORIE = [...DOMYSLNE_KATEGORIE_WYDATKOW, ...DOMYSLNE_KATEGORIE_WPLYWOW];

// Pierwsza kategoria danego typu z listy (do domyślnego wyboru w formularzach).
function pierwszaKategoriaTypu(lista, typ) {
  const k = lista.find((x) => x.typ === typ);
  return k ? k.nazwa : "";
}

const NOWA_KATEGORIA_ZNACZNIK = "__nowa__";

const KLUCZE_ZAKLADEK = ["przeglad", "zapisy", "cele", "cykliczne", "rok", "analiza", "dane"];
const DOMYSLNE_NAZWY_ZAKLADEK = {
  przeglad: "Przegląd",
  zapisy: "Zapisy",
  cele: "Cele",
  cykliczne: "Cykliczne",
  rok: "Rok",
  analiza: "Analiza",
  dane: "Dane",
};

const DNI_TYGODNIA = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

// Zamienia pierwszą literę tekstu na wielką (z polskimi znakami).
function wielka(s) {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("pl-PL") + s.slice(1);
}

function dzisiajISO() {
  return new Date().toISOString().slice(0, 10);
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function isoZDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dzienPo(dataISO) {
  const d = new Date(dataISO + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return isoZDate(d);
}
function roznicaDni(dataStr, odDataStr) {
  const a = new Date(dataStr + "T00:00:00");
  const b = new Date(odDataStr + "T00:00:00");
  return Math.round((a - b) / 86400000);
}
function nastepneWystapienie(cykl, odISO) {
  const od = new Date(odISO + "T00:00:00");
  if (cykl.czestotliwosc === "tygodniowo") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(od);
      d.setDate(od.getDate() + i);
      if (d.getDay() === cykl.dzienTygodnia) return isoZDate(d);
    }
    return odISO;
  }
  if (cykl.czestotliwosc === "rocznie") {
    let rok = od.getFullYear();
    for (let i = 0; i < 2; i++) {
      const ostatniDzien = new Date(rok, cykl.miesiacRoku, 0).getDate();
      const dzien = Math.min(cykl.dzienMiesiaca, ostatniDzien);
      const kandydat = `${rok}-${pad(cykl.miesiacRoku)}-${pad(dzien)}`;
      if (kandydat >= odISO) return kandydat;
      rok += 1;
    }
    return odISO;
  }
  // miesiecznie
  let rok = od.getFullYear();
  let mies = od.getMonth() + 1;
  for (let i = 0; i < 2; i++) {
    const ostatniDzien = new Date(rok, mies, 0).getDate();
    const dzien = Math.min(cykl.dzienMiesiaca, ostatniDzien);
    const kandydat = `${rok}-${pad(mies)}-${pad(dzien)}`;
    if (kandydat >= odISO) return kandydat;
    mies += 1;
    if (mies > 12) { mies = 1; rok += 1; }
  }
  return odISO;
}
function opisCzestotliwosci(cykl) {
  if (cykl.czestotliwosc === "tygodniowo") return `Co tydzień, w ${DNI_TYGODNIA[cykl.dzienTygodnia]}`;
  if (cykl.czestotliwosc === "rocznie") return `Raz w roku, ${cykl.dzienMiesiaca} ${MIESIACE[cykl.miesiacRoku - 1].toLowerCase()}`;
  return `Co miesiąc, ${cykl.dzienMiesiaca}. dnia`;
}
function skrocMiesiac(nazwa) {
  return nazwa.slice(0, 3).toLowerCase();
}
function miesiacKlucz(dateStr) {
  return dateStr.slice(0, 7);
}
function offsetMiesiaca(klucz, offset) {
  const [rok, mies] = klucz.split("-").map(Number);
  const d = new Date(rok, mies - 1 + offset, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function formatujKwote(n) {
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
}
function formaDni(n) {
  return n === 1 ? "dzień" : "dni";
}
const PALETA_WYBORU = [
  ...PALETA,
  "#C0392B", "#D4A017", "#1F8A8A", "#8E44AD",
  "#E67E22", "#2C3E50", "#7F8C8D", "#16A085",
];

function hslNaHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * v).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Wybiera pierwszy jeszcze nieużyty kolor; gdy paleta się skończy, generuje nowy odcień.
function kolejnyKolor(lista) {
  const uzyte = new Set(lista.map((x) => (x.kolor || "").toLowerCase()));
  const wolny = PALETA_WYBORU.find((k) => !uzyte.has(k.toLowerCase()));
  if (wolny) return wolny;
  for (let i = 0; i < 60; i++) {
    const kandydat = hslNaHex((lista.length * 47 + i * 23) % 360, 48, 42);
    if (!uzyte.has(kandydat.toLowerCase())) return kandydat;
  }
  return hslNaHex((lista.length * 47) % 360, 48, 42);
}
function formatujDate(str) {
  return new Date(str + "T00:00:00").toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function obliczSugerowanaWplate(cel) {
  const brakuje = Math.max(0, cel.kwotaDocelowa - cel.kwotaOdlozona);
  if (brakuje === 0 || !cel.termin) return null;
  const dzis = new Date();
  const termin = new Date(cel.termin + "T00:00:00");
  const dni = Math.ceil((termin - dzis) / 86400000);
  if (dni <= 0) return null;
  const miesiace = Math.max(1, Math.ceil(dni / 30));
  return brakuje / miesiace;
}

export default function BudzetDomowy() {
  const [gotowe, setGotowe] = useState(false);
  const [widok, setWidok] = useState("przeglad");
  const [transakcje, setTransakcje] = useState([]);
  const [kategorie, setKategorie] = useState(DOMYSLNE_KATEGORIE);
  const [cele, setCele] = useState([]);
  const [cykliczne, setCykliczne] = useState([]);
  const [nazwyZakladek, setNazwyZakladek] = useState(DOMYSLNE_NAZWY_ZAKLADEK);
  const [edycjaZakladekOtwarta, setEdycjaZakladekOtwarta] = useState(false);
  const [roboczeNazwyZakladek, setRoboczeNazwyZakladek] = useState(DOMYSLNE_NAZWY_ZAKLADEK);
  const [wybranyMiesiac, setWybranyMiesiac] = useState(dzisiajISO().slice(0, 7));
  const [wybranyRok, setWybranyRok] = useState(Number(dzisiajISO().slice(0, 4)));
  const [trybOkresu, setTrybOkresu] = useState("miesiac");
  const [wlasnyOd, setWlasnyOd] = useState("");
  const [wlasnyDo, setWlasnyDo] = useState("");

  const [typ, setTyp] = useState("wydatek");
  const [kwota, setKwota] = useState("");
  const [kategoria, setKategoria] = useState(DOMYSLNE_KATEGORIE[0].nazwa);
  const [opis, setOpis] = useState("");
  const [data, setData] = useState(dzisiajISO());
  const [edytowanaTransakcjaId, setEdytowanaTransakcjaId] = useState(null);

  const [pokazNowaKatWForm, setPokazNowaKatWForm] = useState(false);
  const [nowaKatNazwaForm, setNowaKatNazwaForm] = useState("");
  const [nowaKatLimitForm, setNowaKatLimitForm] = useState("");

  const [formularzKategoriiTyp, setFormularzKategoriiTyp] = useState(null); // null | "wydatek" | "wplyw"
  const [nowaKategoriaNazwa, setNowaKategoriaNazwa] = useState("");
  const [nowaKategoriaLimit, setNowaKategoriaLimit] = useState("");

  const [edytowanyKolorId, setEdytowanyKolorId] = useState(null);
  const [nowaKategoriaKolor, setNowaKategoriaKolor] = useState(null);
  const [edytowanyLimitId, setEdytowanyLimitId] = useState(null);
  const [edytowanyLimitWartosc, setEdytowanyLimitWartosc] = useState("");

  const [edytowanaNazwaId, setEdytowanaNazwaId] = useState(null);
  const [edytowanaNazwaWartosc, setEdytowanaNazwaWartosc] = useState("");

  const [pokazFormularzCelu, setPokazFormularzCelu] = useState(false);
  const [edytowanyCelId, setEdytowanyCelId] = useState(null);
  const [nowyCelEmoji, setNowyCelEmoji] = useState("");
  const [nowyCelNazwa, setNowyCelNazwa] = useState("");
  const [nowyCelDocelowa, setNowyCelDocelowa] = useState("");
  const [nowyCelPoczatkowa, setNowyCelPoczatkowa] = useState("");
  const [nowyCelTermin, setNowyCelTermin] = useState("");

  const [edytowanaWplataId, setEdytowanaWplataId] = useState(null);
  const [edytowanaWplataWartosc, setEdytowanaWplataWartosc] = useState("");

  const [pokazFormularzCyklu, setPokazFormularzCyklu] = useState(false);
  const [edytowanyCyklId, setEdytowanyCyklId] = useState(null);
  const [nowyCyklNazwa, setNowyCyklNazwa] = useState("");
  const [nowyCyklTyp, setNowyCyklTyp] = useState("wydatek");
  const [nowyCyklKwota, setNowyCyklKwota] = useState("");
  const [nowyCyklKategoria, setNowyCyklKategoria] = useState(DOMYSLNE_KATEGORIE[0].nazwa);
  const [nowyCyklCzestotliwosc, setNowyCyklCzestotliwosc] = useState("miesiecznie");
  const [nowyCyklDzienMiesiaca, setNowyCyklDzienMiesiaca] = useState("1");
  const [nowyCyklDzienTygodnia, setNowyCyklDzienTygodnia] = useState("1");
  const [nowyCyklMiesiacRoku, setNowyCyklMiesiacRoku] = useState("1");

  const [importDoZatwierdzenia, setImportDoZatwierdzenia] = useState(null);
  const [bladImportu, setBladImportu] = useState(null);
  const [komunikatDanych, setKomunikatDanych] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const wynik = await window.storage.get("budzet-dane");
        let parsedTransakcje = [];
        let parsedKategorie = DOMYSLNE_KATEGORIE;
        let parsedCele = [];
        let parsedCykliczne = [];
        let parsedNazwyZakladek = DOMYSLNE_NAZWY_ZAKLADEK;
        if (wynik && wynik.value) {
          const parsed = JSON.parse(wynik.value);
          if (parsed.transakcje) parsedTransakcje = parsed.transakcje;
          if (parsed.kategorie) parsedKategorie = parsed.kategorie;
          if (parsed.cele) parsedCele = parsed.cele;
          if (parsed.cykliczne) parsedCykliczne = parsed.cykliczne;
          if (parsed.nazwyZakladek) parsedNazwyZakladek = { ...DOMYSLNE_NAZWY_ZAKLADEK, ...parsed.nazwyZakladek };
        }

        // materializacja zaległych transakcji cyklicznych (bez duplikatów - śledzimy ostatnią aktywację)
        const dzis = dzisiajISO();
        let zmieniono = false;

        // Wcześniej zapisane kategorie pisane małą literą -> wielka litera (z zachowaniem spójności historii).
        const zmianyNazw = {};
        parsedKategorie = parsedKategorie.map((k) => {
          const n = wielka(k.nazwa);
          const kolizja = n !== k.nazwa && parsedKategorie.some((x) => x.nazwa === n);
          if (n !== k.nazwa && !kolizja) {
            zmianyNazw[k.nazwa] = n;
            return { ...k, nazwa: n };
          }
          return k;
        });
        if (Object.keys(zmianyNazw).length > 0) {
          zmieniono = true;
          parsedTransakcje = parsedTransakcje.map((t) =>
            t.typ === "wydatek" && zmianyNazw[t.kategoria] ? { ...t, kategoria: zmianyNazw[t.kategoria] } : t
          );
          parsedCykliczne = parsedCykliczne.map((cy) =>
            cy.typ === "wydatek" && zmianyNazw[cy.kategoria] ? { ...cy, kategoria: zmianyNazw[cy.kategoria] } : cy
          );
        }

        // Kategorie zapisane przed wprowadzeniem podziału na wydatki/wpływy -> domyślnie "wydatek".
        const brakowaloTypu = parsedKategorie.some((k) => !k.typ);
        if (brakowaloTypu) {
          parsedKategorie = parsedKategorie.map((k) => ({ ...k, typ: k.typ || "wydatek" }));
          zmieniono = true;
        }
        // Jeśli nikt nigdy nie miał kategorii wpływów (stare dane lub świeży import), dodaj domyślne.
        if (!parsedKategorie.some((k) => k.typ === "wplyw")) {
          parsedKategorie = [...parsedKategorie, ...DOMYSLNE_KATEGORIE_WPLYWOW.map((k) => ({ ...k }))];
          zmieniono = true;
        }

        const noweTransakcje = [...parsedTransakcje];
        const noweCykliczne = parsedCykliczne.map((cykl) => {
          let ostatnia = cykl.ostatniaAktywacja || dzis;
          let licznik = 0;
          while (licznik < 36) {
            const start = dzienPo(ostatnia);
            const wyst = nastepneWystapienie(cykl, start);
            if (wyst > dzis) break;
            noweTransakcje.unshift({
              id: "auto" + cykl.id + "-" + wyst,
              typ: cykl.typ,
              kwota: cykl.kwota,
              kategoria: cykl.typ === "wydatek" ? cykl.kategoria : cykl.nazwa,
              opis: "cykliczne: " + cykl.nazwa,
              data: wyst,
            });
            ostatnia = wyst;
            zmieniono = true;
            licznik++;
          }
          return ostatnia !== cykl.ostatniaAktywacja ? { ...cykl, ostatniaAktywacja: ostatnia } : cykl;
        });

        setTransakcje(noweTransakcje);
        setKategorie(parsedKategorie);
        const pierwszaWydatkowa = pierwszaKategoriaTypu(parsedKategorie, "wydatek");
        if (pierwszaWydatkowa) {
          setKategoria(pierwszaWydatkowa);
          setNowyCyklKategoria(pierwszaWydatkowa);
        }
        setCele(parsedCele);
        setCykliczne(noweCykliczne);
        setNazwyZakladek(parsedNazwyZakladek);
        setRoboczeNazwyZakladek(parsedNazwyZakladek);

        if (zmieniono) {
          window.storage
            .set(
              "budzet-dane",
              JSON.stringify({
                transakcje: noweTransakcje,
                kategorie: parsedKategorie,
                cele: parsedCele,
                cykliczne: noweCykliczne,
                nazwyZakladek: parsedNazwyZakladek,
              }),
              false
            )
            .catch((e) => console.error("Nie udało się zapisać zmaterializowanych transakcji", e));
        }
      } catch (e) {
        // brak zapisanych danych - zaczynamy od zera
      } finally {
        setGotowe(true);
      }
    })();
  }, []);

  async function zapisz(noweTransakcje, noweKategorie, noweCele = cele, noweCykliczne = cykliczne, noweNazwyZakladek = nazwyZakladek) {
    try {
      await window.storage.set(
        "budzet-dane",
        JSON.stringify({
          transakcje: noweTransakcje,
          kategorie: noweKategorie,
          cele: noweCele,
          cykliczne: noweCykliczne,
          nazwyZakladek: noweNazwyZakladek,
        }),
        false
      );
    } catch (e) {
      console.error("Nie udało się zapisać danych", e);
    }
  }

  function obslugaZmianyKategoriiWForm(wartosc) {
    if (wartosc === NOWA_KATEGORIA_ZNACZNIK) {
      setPokazNowaKatWForm(true);
    } else {
      setPokazNowaKatWForm(false);
      setKategoria(wartosc);
    }
  }

  // Zmiana typu (wydatek/wpływ) w głównym formularzu - ustawia też pasującą kategorię,
  // żeby select nie wskazywał "widmowo" na kategorię z innej grupy.
  function zmienTypFormularza(nowyTyp) {
    setTyp(nowyTyp);
    setKategoria(pierwszaKategoriaTypu(kategorie, nowyTyp));
    setPokazNowaKatWForm(false);
  }

  function dodajTransakcje(e) {
    e.preventDefault();
    const kwotaLiczba = parseFloat(kwota.replace(",", "."));
    if (!kwotaLiczba || kwotaLiczba <= 0 || !data) return;

    let aktualneKategorie = kategorie;
    let nazwaKategorii = kategoria;

    if (pokazNowaKatWForm) {
      const nazwa = wielka(nowaKatNazwaForm.trim());
      if (!nazwa) return;
      const limit = typ === "wydatek" && nowaKatLimitForm.trim() ? parseFloat(nowaKatLimitForm.replace(",", ".")) : null;
      const nowaKat = { id: "k" + Date.now(), nazwa, limit, kolor: kolejnyKolor(kategorie.filter((k) => k.typ === typ)), typ };
      aktualneKategorie = [...kategorie, nowaKat];
      nazwaKategorii = nazwa;
      setKategorie(aktualneKategorie);
    }

    if (!nazwaKategorii) return;
    const kategoriaKoncowa = nazwaKategorii;

    let nowe;
    if (edytowanaTransakcjaId) {
      nowe = transakcje.map((t) =>
        t.id !== edytowanaTransakcjaId
          ? t
          : { ...t, typ, kwota: kwotaLiczba, kategoria: kategoriaKoncowa, opis: wielka(opis.trim()), data }
      );
    } else {
      const wpis = {
        id: String(Date.now()),
        typ,
        kwota: kwotaLiczba,
        kategoria: kategoriaKoncowa,
        opis: wielka(opis.trim()),
        data,
      };
      nowe = [wpis, ...transakcje];
    }

    setTransakcje(nowe);
    zapisz(nowe, aktualneKategorie);
    setKwota("");
    setOpis("");
    setPokazNowaKatWForm(false);
    setNowaKatNazwaForm("");
    setNowaKatLimitForm("");
    if (edytowanaTransakcjaId) setData(dzisiajISO());
    setEdytowanaTransakcjaId(null);
    setKategoria(nazwaKategorii);
  }

  function rozpocznijEdycjeTransakcji(t) {
    setEdytowanaTransakcjaId(t.id);
    setTyp(t.typ);
    setKwota(String(t.kwota).replace(".", ","));
    setKategoria(t.kategoria);
    setOpis(t.opis || "");
    setData(t.data);
    setPokazNowaKatWForm(false);
  }

  function anulujEdycjeTransakcji() {
    setEdytowanaTransakcjaId(null);
    setKwota("");
    setOpis("");
    setData(dzisiajISO());
    setPokazNowaKatWForm(false);
  }


  function usunTransakcje(id) {
    const nowe = transakcje.filter((t) => t.id !== id);
    setTransakcje(nowe);
    zapisz(nowe, kategorie);
  }

  function dodajKategorie(e, typKategorii) {
    e.preventDefault();
    const nazwa = wielka(nowaKategoriaNazwa.trim());
    if (!nazwa) return;
    const limit = typKategorii === "wydatek" && nowaKategoriaLimit.trim() ? parseFloat(nowaKategoriaLimit.replace(",", ".")) : null;
    const nowa = {
      id: "k" + Date.now(),
      nazwa,
      limit,
      kolor: nowaKategoriaKolor || kolejnyKolor(kategorie.filter((k) => k.typ === typKategorii)),
      typ: typKategorii,
    };
    const nowe = [...kategorie, nowa];
    setKategorie(nowe);
    zapisz(transakcje, nowe);
    setNowaKategoriaKolor(null);
    setNowaKategoriaNazwa("");
    setNowaKategoriaLimit("");
    setFormularzKategoriiTyp(null);
  }

  // Przesuwa kategorię w górę/w dół TYLKO w obrębie jej własnej grupy (wydatki albo wpływy),
  // żeby obie listy miały niezależną kolejność mimo wspólnej tablicy danych.
  function przesunKategorie(id, kierunek) {
    const kat = kategorie.find((k) => k.id === id);
    if (!kat) return;
    const grupa = kategorie.filter((k) => k.typ === kat.typ);
    const idxWGrupie = grupa.findIndex((k) => k.id === id);
    const celWGrupie = idxWGrupie + kierunek;
    if (celWGrupie < 0 || celWGrupie >= grupa.length) return;
    const idA = grupa[idxWGrupie].id;
    const idB = grupa[celWGrupie].id;
    const nowe = [...kategorie];
    const posA = nowe.findIndex((k) => k.id === idA);
    const posB = nowe.findIndex((k) => k.id === idB);
    [nowe[posA], nowe[posB]] = [nowe[posB], nowe[posA]];
    setKategorie(nowe);
    zapisz(transakcje, nowe);
  }

  function zmienKolorKategorii(id, kolor) {
    const nowe = kategorie.map((k) => (k.id === id ? { ...k, kolor } : k));
    setKategorie(nowe);
    zapisz(transakcje, nowe);
  }

  function usunKategorie(id) {
    const usuwana = kategorie.find((k) => k.id === id);
    const nowe = kategorie.filter((k) => k.id !== id);
    setKategorie(nowe);
    zapisz(transakcje, nowe);
    if (usuwana && kategoria === usuwana.nazwa) setKategoria(pierwszaKategoriaTypu(nowe, typ));
    if (usuwana && nowyCyklKategoria === usuwana.nazwa) setNowyCyklKategoria(pierwszaKategoriaTypu(nowe, nowyCyklTyp));
  }

  function zapiszLimit(id) {
    const wartosc = edytowanyLimitWartosc.trim();
    const limit = wartosc ? parseFloat(wartosc.replace(",", ".")) : null;
    const nowe = kategorie.map((k) => (k.id === id ? { ...k, limit } : k));
    setKategorie(nowe);
    zapisz(transakcje, nowe);
    setEdytowanyLimitId(null);
    setEdytowanyLimitWartosc("");
  }

  function rozpocznijEdycjeNazwy(k) {
    setEdytowanaNazwaId(k.id);
    setEdytowanaNazwaWartosc(k.nazwa);
  }

  function zapiszNazwe(id) {
    const staraKategoria = kategorie.find((k) => k.id === id);
    const nowaNazwa = wielka(edytowanaNazwaWartosc.trim());
    if (!staraKategoria || !nowaNazwa || nowaNazwa === staraKategoria.nazwa) {
      setEdytowanaNazwaId(null);
      return;
    }
    const staraNazwa = staraKategoria.nazwa;
    const noweKategorie = kategorie.map((k) => (k.id === id ? { ...k, nazwa: nowaNazwa } : k));
    const noweTransakcje = transakcje.map((t) =>
      t.typ === "wydatek" && t.kategoria === staraNazwa ? { ...t, kategoria: nowaNazwa } : t
    );
    setKategorie(noweKategorie);
    setTransakcje(noweTransakcje);
    zapisz(noweTransakcje, noweKategorie);
    if (kategoria === staraNazwa) setKategoria(nowaNazwa);
    setEdytowanaNazwaId(null);
    setEdytowanaNazwaWartosc("");
  }

  function dodajCel(e) {
    e.preventDefault();
    const nazwa = wielka(nowyCelNazwa.trim());
    const docelowa = parseFloat(nowyCelDocelowa.replace(",", "."));
    if (!nazwa || !docelowa || docelowa <= 0) return;

    let nowe;
    if (edytowanyCelId) {
      nowe = cele.map((c) =>
        c.id !== edytowanyCelId
          ? c
          : { ...c, nazwa, emoji: nowyCelEmoji.trim() || "🎯", kwotaDocelowa: docelowa, termin: nowyCelTermin || null }
      );
    } else {
      const poczatkowa = nowyCelPoczatkowa.trim() ? parseFloat(nowyCelPoczatkowa.replace(",", ".")) : 0;
      const nowyCel = {
        id: "c" + Date.now(),
        nazwa,
        emoji: nowyCelEmoji.trim() || "🎯",
        kwotaDocelowa: docelowa,
        kwotaOdlozona: Math.max(0, poczatkowa),
        termin: nowyCelTermin || null,
        kolor: kolejnyKolor(cele),
      };
      nowe = [...cele, nowyCel];
    }
    setCele(nowe);
    zapisz(transakcje, kategorie, nowe);
    anulujFormularzCelu();
  }

  function rozpocznijEdycjeCelu(cel) {
    setEdytowanyCelId(cel.id);
    setNowyCelNazwa(cel.nazwa);
    setNowyCelEmoji(cel.emoji || "");
    setNowyCelDocelowa(String(cel.kwotaDocelowa).replace(".", ","));
    setNowyCelTermin(cel.termin || "");
    setPokazFormularzCelu(true);
  }

  function anulujFormularzCelu() {
    setEdytowanyCelId(null);
    setNowyCelEmoji("");
    setNowyCelNazwa("");
    setNowyCelDocelowa("");
    setNowyCelPoczatkowa("");
    setNowyCelTermin("");
    setPokazFormularzCelu(false);
  }

  function usunCel(id) {
    const nowe = cele.filter((c) => c.id !== id);
    setCele(nowe);
    zapisz(transakcje, kategorie, nowe);
    if (edytowanyCelId === id) anulujFormularzCelu();
  }

  function zapiszWplate(id) {
    const kwotaWplaty = parseFloat(edytowanaWplataWartosc.replace(",", "."));
    if (!kwotaWplaty || kwotaWplaty <= 0) {
      setEdytowanaWplataId(null);
      return;
    }
    const nowe = cele.map((c) =>
      c.id === id
        ? {
            ...c,
            kwotaOdlozona: c.kwotaOdlozona + kwotaWplaty,
            historiaWplat: [...(Array.isArray(c.historiaWplat) ? c.historiaWplat : []), { data: dzisiajISO(), kwota: kwotaWplaty }],
          }
        : c
    );
    setCele(nowe);
    zapisz(transakcje, kategorie, nowe);
    setEdytowanaWplataId(null);
    setEdytowanaWplataWartosc("");
  }

  function dodajCykliczna(e) {
    e.preventDefault();
    const nazwa = wielka(nowyCyklNazwa.trim());
    const kwotaLiczba = parseFloat(nowyCyklKwota.replace(",", "."));
    if (!nazwa || !kwotaLiczba || kwotaLiczba <= 0) return;

    const wspolnePola = {
      nazwa,
      typ: nowyCyklTyp,
      kwota: kwotaLiczba,
      kategoria: nowyCyklKategoria,
      czestotliwosc: nowyCyklCzestotliwosc,
      dzienMiesiaca: parseInt(nowyCyklDzienMiesiaca, 10) || 1,
      dzienTygodnia: parseInt(nowyCyklDzienTygodnia, 10) || 0,
      miesiacRoku: parseInt(nowyCyklMiesiacRoku, 10) || 1,
    };

    let nowe;
    if (edytowanyCyklId) {
      nowe = cykliczne.map((c) => (c.id !== edytowanyCyklId ? c : { ...c, ...wspolnePola }));
    } else {
      const nowyCykl = {
        id: "cy" + Date.now(),
        ...wspolnePola,
        ostatniaAktywacja: dzisiajISO(),
        kolor: kolejnyKolor(cykliczne),
      };
      nowe = [...cykliczne, nowyCykl];
    }
    setCykliczne(nowe);
    zapisz(transakcje, kategorie, cele, nowe);
    anulujFormularzCyklu();
  }

  function rozpocznijEdycjeCyklu(cykl) {
    setEdytowanyCyklId(cykl.id);
    setNowyCyklNazwa(cykl.nazwa);
    setNowyCyklTyp(cykl.typ);
    setNowyCyklKwota(String(cykl.kwota).replace(".", ","));
    setNowyCyklKategoria(cykl.kategoria);
    setNowyCyklCzestotliwosc(cykl.czestotliwosc);
    setNowyCyklDzienMiesiaca(String(cykl.dzienMiesiaca));
    setNowyCyklDzienTygodnia(String(cykl.dzienTygodnia));
    setNowyCyklMiesiacRoku(String(cykl.miesiacRoku));
    setPokazFormularzCyklu(true);
  }

  function anulujFormularzCyklu() {
    setEdytowanyCyklId(null);
    setNowyCyklNazwa("");
    setNowyCyklKwota("");
    setPokazFormularzCyklu(false);
  }

  // Zmiana typu (wydatek/wpływ) w formularzu cyklicznej transakcji - dopasowuje kategorię do grupy.
  function zmienNowyCyklTyp(nowyTyp) {
    setNowyCyklTyp(nowyTyp);
    setNowyCyklKategoria(pierwszaKategoriaTypu(kategorie, nowyTyp));
  }

  function usunCykliczna(id) {
    const nowe = cykliczne.filter((c) => c.id !== id);
    setCykliczne(nowe);
    zapisz(transakcje, kategorie, cele, nowe);
    if (edytowanyCyklId === id) anulujFormularzCyklu();
  }

  function otworzEdycjeZakladek() {
    setRoboczeNazwyZakladek({ ...nazwyZakladek });
    setEdycjaZakladekOtwarta(true);
  }

  function zmienNazweZakladkiRoboczej(klucz, wartosc) {
    setRoboczeNazwyZakladek((prev) => ({ ...prev, [klucz]: wartosc }));
  }

  function zapiszEdycjeZakladek() {
    const oczyszczone = {};
    KLUCZE_ZAKLADEK.forEach((k) => {
      const wpisana = wielka((roboczeNazwyZakladek[k] || "").trim());
      oczyszczone[k] = wpisana || DOMYSLNE_NAZWY_ZAKLADEK[k];
    });
    setNazwyZakladek(oczyszczone);
    zapisz(transakcje, kategorie, cele, cykliczne, oczyszczone);
    setEdycjaZakladekOtwarta(false);
  }

  function anulujEdycjeZakladek() {
    setRoboczeNazwyZakladek({ ...nazwyZakladek });
    setEdycjaZakladekOtwarta(false);
  }

  function pobierzPlik(blob, nazwaPliku) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nazwaPliku;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function eksportujCSV() {
    const naglowek = "Data,Typ,Kategoria,Kwota,Opis";
    const wiersze = transakcje.map((t) => {
      const kat = '"' + String(t.kategoria).replace(/"/g, '""') + '"';
      const opisPole = '"' + String(t.opis || "").replace(/"/g, '""') + '"';
      const typPole = t.typ === "wplyw" ? "Wpływ" : "Wydatek";
      return [t.data, typPole, kat, t.kwota.toFixed(2).replace(".", ","), opisPole].join(",");
    });
    const csv = [naglowek, ...wiersze].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    pobierzPlik(blob, `budzet-domowy-zapisy-${dzisiajISO()}.csv`);
    setKomunikatDanych("Wyeksportowano zapisy do pliku CSV.");
  }

  function eksportujJSON() {
    const dane = {
      transakcje, kategorie, cele, cykliczne, nazwyZakladek,
      eksportUtworzony: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dane, null, 2)], { type: "application/json" });
    pobierzPlik(blob, `budzet-domowy-kopia-zapasowa-${dzisiajISO()}.json`);
    setKomunikatDanych("Wyeksportowano pełną kopię zapasową (JSON).");
  }

  function obslugaImportu(e) {
    const plik = e.target.files[0];
    e.target.value = "";
    if (!plik) return;
    setKomunikatDanych(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const dane = JSON.parse(event.target.result);
        if (typeof dane !== "object" || dane === null) throw new Error("zły format");
        setImportDoZatwierdzenia(dane);
        setBladImportu(null);
      } catch (err) {
        setBladImportu("Nie udało się odczytać pliku. Upewnij się, że to poprawny plik kopii zapasowej JSON.");
        setImportDoZatwierdzenia(null);
      }
    };
    reader.onerror = () => {
      setBladImportu("Nie udało się odczytać pliku.");
    };
    reader.readAsText(plik);
  }

  function zatwierdzImport() {
    if (!importDoZatwierdzenia) return;
    const d = importDoZatwierdzenia;
    const noweTransakcje = Array.isArray(d.transakcje) ? d.transakcje : [];
    const noweKategorie = Array.isArray(d.kategorie) && d.kategorie.length > 0 ? d.kategorie : DOMYSLNE_KATEGORIE;
    const noweCele = Array.isArray(d.cele) ? d.cele : [];
    const noweCykliczne = Array.isArray(d.cykliczne) ? d.cykliczne : [];
    const noweNazwyZakladek = { ...DOMYSLNE_NAZWY_ZAKLADEK, ...(d.nazwyZakladek || {}) };
    setTransakcje(noweTransakcje);
    setKategorie(noweKategorie);
    setCele(noweCele);
    setCykliczne(noweCykliczne);
    setNazwyZakladek(noweNazwyZakladek);
    setRoboczeNazwyZakladek(noweNazwyZakladek);
    zapisz(noweTransakcje, noweKategorie, noweCele, noweCykliczne, noweNazwyZakladek);
    setImportDoZatwierdzenia(null);
    setKomunikatDanych("Dane zostały przywrócone z pliku kopii zapasowej.");
  }

  function anulujImport() {
    setImportDoZatwierdzenia(null);
    setBladImportu(null);
  }

  function zmienMiesiac(delta) {
    const [rok, mies] = wybranyMiesiac.split("-").map(Number);
    const d = new Date(rok, mies - 1 + delta, 1);
    setWybranyMiesiac(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function wlaczWlasnyOkres() {
    if (!wlasnyOd || !wlasnyDo) {
      const [rok, mies] = wybranyMiesiac.split("-").map(Number);
      const ostatniDzien = new Date(rok, mies, 0).getDate();
      setWlasnyOd(`${wybranyMiesiac}-01`);
      setWlasnyDo(`${wybranyMiesiac}-${String(ostatniDzien).padStart(2, "0")}`);
    }
    setTrybOkresu("wlasny");
  }

  const transakcjeMiesiac = useMemo(() => {
    if (trybOkresu === "wlasny") {
      if (!wlasnyOd || !wlasnyDo) return [];
      return transakcje.filter((t) => t.data >= wlasnyOd && t.data <= wlasnyDo);
    }
    return transakcje.filter((t) => miesiacKlucz(t.data) === wybranyMiesiac);
  }, [transakcje, wybranyMiesiac, trybOkresu, wlasnyOd, wlasnyDo]);
  const wplywy = useMemo(
    () => transakcjeMiesiac.filter((t) => t.typ === "wplyw").reduce((s, t) => s + t.kwota, 0),
    [transakcjeMiesiac]
  );
  const wydatki = useMemo(
    () => transakcjeMiesiac.filter((t) => t.typ === "wydatek").reduce((s, t) => s + t.kwota, 0),
    [transakcjeMiesiac]
  );
  const bilans = wplywy - wydatki;

  const wydatkiWgKategorii = useMemo(() => {
    const mapa = {};
    transakcjeMiesiac
      .filter((t) => t.typ === "wydatek")
      .forEach((t) => {
        mapa[t.kategoria] = (mapa[t.kategoria] || 0) + t.kwota;
      });
    return mapa;
  }, [transakcjeMiesiac]);

  const wplywyWgKategorii = useMemo(() => {
    const mapa = {};
    transakcjeMiesiac
      .filter((t) => t.typ === "wplyw")
      .forEach((t) => {
        mapa[t.kategoria] = (mapa[t.kategoria] || 0) + t.kwota;
      });
    return mapa;
  }, [transakcjeMiesiac]);

  const transakcjeWgDnia = useMemo(() => {
    const grupy = {};
    transakcjeMiesiac.forEach((t) => {
      if (!grupy[t.data]) grupy[t.data] = [];
      grupy[t.data].push(t);
    });
    return Object.entries(grupy).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [transakcjeMiesiac]);

  function kolorKategorii(nazwa, typPreferowany) {
    const k = typPreferowany
      ? kategorie.find((kk) => kk.nazwa === nazwa && kk.typ === typPreferowany) || kategorie.find((kk) => kk.nazwa === nazwa)
      : kategorie.find((kk) => kk.nazwa === nazwa);
    return k ? k.kolor : "#6B7280";
  }

  // ---- dane dla ekranu Przegląd ----
  const dzisiajKey = dzisiajISO().slice(0, 7);
  const czyBiezacyMiesiac = trybOkresu === "miesiac" && wybranyMiesiac === dzisiajKey;

  const najwiekszaKategoria = useMemo(() => {
    const wpisy = Object.entries(wydatkiWgKategorii);
    if (wpisy.length === 0) return null;
    return wpisy.reduce((max, wpis) => (wpis[1] > max[1] ? wpis : max), wpisy[0]);
  }, [wydatkiWgKategorii]);

  const najwiekszyWydatek = useMemo(() => {
    const wydatkowe = transakcjeMiesiac.filter((t) => t.typ === "wydatek");
    if (wydatkowe.length === 0) return null;
    return wydatkowe.reduce((max, t) => (t.kwota > max.kwota ? t : max), wydatkowe[0]);
  }, [transakcjeMiesiac]);

  const wykorzystanieProcent = useMemo(() => {
    const zLimitem = kategorie.filter((k) => k.typ === "wydatek" && k.limit != null && k.limit > 0);
    if (zLimitem.length === 0) return null;
    const sumaLimitow = zLimitem.reduce((s, k) => s + k.limit, 0);
    const sumaWydanych = zLimitem.reduce((s, k) => s + (wydatkiWgKategorii[k.nazwa] || 0), 0);
    if (sumaLimitow === 0) return null;
    return (sumaWydanych / sumaLimitow) * 100;
  }, [kategorie, wydatkiWgKategorii]);

  const dniPozostale = useMemo(() => {
    if (!czyBiezacyMiesiac) return null;
    const [rok, mies] = wybranyMiesiac.split("-").map(Number);
    const dniWMiesiacu = new Date(rok, mies, 0).getDate();
    const dzisDzien = new Date().getDate();
    return Math.max(1, dniWMiesiacu - dzisDzien + 1);
  }, [czyBiezacyMiesiac, wybranyMiesiac]);

  const sumaMiesiecznychWplatNaCele = useMemo(
    () => cele.reduce((s, c) => s + (obliczSugerowanaWplate(c) || 0), 0),
    [cele]
  );

  const pozostalyBudzet = bilans - sumaMiesiecznychWplatNaCele;
  const kwotaDziennie =
    czyBiezacyMiesiac && dniPozostale && pozostalyBudzet > 0 ? pozostalyBudzet / dniPozostale : null;

  const nadchodzace = useMemo(() => {
    const dzis = dzisiajISO();
    return cykliczne
      .map((cykl) => {
        const nastepna = nastepneWystapienie(cykl, dzienPo(dzis));
        return { ...cykl, nastepna, dni: roznicaDni(nastepna, dzis) };
      })
      .sort((a, b) => a.dni - b.dni);
  }, [cykliczne]);

  const [rokWyb, miesWyb] = wybranyMiesiac.split("-").map(Number);
  const tytulMiesiaca = `${MIESIACE[miesWyb - 1]} ${rokWyb}`;
  const maxKategoria = Math.max(1, ...Object.values(wydatkiWgKategorii));

  // ---- porównanie z poprzednim miesiącem ----
  const poprzedniMiesiacKlucz = useMemo(() => {
    const d = new Date(rokWyb, miesWyb - 2, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }, [rokWyb, miesWyb]);
  const poprzedniMiesWyb = Number(poprzedniMiesiacKlucz.split("-")[1]);

  const transakcjePoprzedniegoMiesiaca = useMemo(
    () => transakcje.filter((t) => miesiacKlucz(t.data) === poprzedniMiesiacKlucz),
    [transakcje, poprzedniMiesiacKlucz]
  );
  const czyIstniejaDanePoprzednie = transakcjePoprzedniegoMiesiaca.length > 0;

  const wydatkiPoprzedniSuma = useMemo(
    () => transakcjePoprzedniegoMiesiaca.filter((t) => t.typ === "wydatek").reduce((s, t) => s + t.kwota, 0),
    [transakcjePoprzedniegoMiesiaca]
  );

  const wydatkiPoprzedniWgKategorii = useMemo(() => {
    const mapa = {};
    transakcjePoprzedniegoMiesiaca
      .filter((t) => t.typ === "wydatek")
      .forEach((t) => { mapa[t.kategoria] = (mapa[t.kategoria] || 0) + t.kwota; });
    return mapa;
  }, [transakcjePoprzedniegoMiesiaca]);

  const zmianaCalkowitaProcent = useMemo(() => {
    if (wydatkiPoprzedniSuma === 0) return null;
    return ((wydatki - wydatkiPoprzedniSuma) / wydatkiPoprzedniSuma) * 100;
  }, [wydatki, wydatkiPoprzedniSuma]);

  const listaPorownaniaKategorii = useMemo(() => {
    const nazwy = new Set([...Object.keys(wydatkiWgKategorii), ...Object.keys(wydatkiPoprzedniWgKategorii)]);
    return Array.from(nazwy)
      .map((nazwa) => {
        const aktualna = wydatkiWgKategorii[nazwa] || 0;
        const poprzednia = wydatkiPoprzedniWgKategorii[nazwa] || 0;
        const roznicaProcent = poprzednia > 0 ? ((aktualna - poprzednia) / poprzednia) * 100 : aktualna > 0 ? null : 0;
        return { nazwa, aktualna, poprzednia, roznicaProcent };
      })
      .sort((a, b) => b.aktualna - a.aktualna);
  }, [wydatkiWgKategorii, wydatkiPoprzedniWgKategorii]);

  // ---- podsumowanie roczne ----
  const transakcjeRoku = useMemo(
    () => transakcje.filter((t) => t.data.slice(0, 4) === String(wybranyRok)),
    [transakcje, wybranyRok]
  );

  const wplywyRoczne = useMemo(
    () => transakcjeRoku.filter((t) => t.typ === "wplyw").reduce((s, t) => s + t.kwota, 0),
    [transakcjeRoku]
  );
  const wydatkiRoczne = useMemo(
    () => transakcjeRoku.filter((t) => t.typ === "wydatek").reduce((s, t) => s + t.kwota, 0),
    [transakcjeRoku]
  );
  const bilansRoczny = wplywyRoczne - wydatkiRoczne;

  const miesieczneDaneRoku = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mies = i + 1;
      const klucz = `${wybranyRok}-${pad(mies)}`;
      const tego = transakcjeRoku.filter((t) => miesiacKlucz(t.data) === klucz);
      const wplywy = tego.filter((t) => t.typ === "wplyw").reduce((s, t) => s + t.kwota, 0);
      const wydatki = tego.filter((t) => t.typ === "wydatek").reduce((s, t) => s + t.kwota, 0);
      return { miesiac: mies, wplywy, wydatki, bilans: wplywy - wydatki, maDane: tego.length > 0 };
    });
  }, [transakcjeRoku, wybranyRok]);

  const liczbaMiesiecyZDanymi = miesieczneDaneRoku.filter((m) => m.maDane).length;
  const srednieWplywyMiesieczne = liczbaMiesiecyZDanymi > 0 ? wplywyRoczne / liczbaMiesiecyZDanymi : 0;
  const srednieWydatkiMiesieczne = liczbaMiesiecyZDanymi > 0 ? wydatkiRoczne / liczbaMiesiecyZDanymi : 0;

  const najlepszyMiesiacRoku = useMemo(() => {
    const zDanymi = miesieczneDaneRoku.filter((m) => m.maDane);
    if (zDanymi.length === 0) return null;
    return zDanymi.reduce((max, m) => (m.bilans > max.bilans ? m : max), zDanymi[0]);
  }, [miesieczneDaneRoku]);

  const najdrozszyMiesiacRoku = useMemo(() => {
    const zDanymi = miesieczneDaneRoku.filter((m) => m.maDane);
    if (zDanymi.length === 0) return null;
    return zDanymi.reduce((max, m) => (m.wydatki > max.wydatki ? m : max), zDanymi[0]);
  }, [miesieczneDaneRoku]);

  const wydatkiRoczneWgKategorii = useMemo(() => {
    const mapa = {};
    transakcjeRoku
      .filter((t) => t.typ === "wydatek")
      .forEach((t) => { mapa[t.kategoria] = (mapa[t.kategoria] || 0) + t.kwota; });
    return mapa;
  }, [transakcjeRoku]);

  const rankingKategoriiRoku = useMemo(
    () => Object.entries(wydatkiRoczneWgKategorii).sort((a, b) => b[1] - a[1]),
    [wydatkiRoczneWgKategorii]
  );

  const najwiekszaKategoriaRoku = rankingKategoriiRoku.length > 0 ? rankingKategoriiRoku[0] : null;

  const najwiekszyWydatekRoku = useMemo(() => {
    const wydatkowe = transakcjeRoku.filter((t) => t.typ === "wydatek");
    if (wydatkowe.length === 0) return null;
    return wydatkowe.reduce((max, t) => (t.kwota > max.kwota ? t : max), wydatkowe[0]);
  }, [transakcjeRoku]);

  const maxWMiesiacuRoku = Math.max(1, ...miesieczneDaneRoku.map((m) => Math.max(m.wplywy, m.wydatki)));

  // ---- inteligentna analiza finansów (oparta wyłącznie na rzeczywistych danych) ----
  const miesiacAnalizy = dzisiajISO().slice(0, 7);
  const poprzedniMiesiacAnalizy = offsetMiesiaca(miesiacAnalizy, -1);
  const trzyPoprzednieMiesiaceAnalizy = [1, 2, 3].map((i) => offsetMiesiaca(miesiacAnalizy, -i));

  const wydatkiAnalizyWgKategorii = useMemo(() => {
    const mapa = {};
    transakcje
      .filter((t) => miesiacKlucz(t.data) === miesiacAnalizy && t.typ === "wydatek")
      .forEach((t) => { mapa[t.kategoria] = (mapa[t.kategoria] || 0) + t.kwota; });
    return mapa;
  }, [transakcje, miesiacAnalizy]);

  const wydatkiPoprzedniAnalizyWgKategorii = useMemo(() => {
    const mapa = {};
    transakcje
      .filter((t) => miesiacKlucz(t.data) === poprzedniMiesiacAnalizy && t.typ === "wydatek")
      .forEach((t) => { mapa[t.kategoria] = (mapa[t.kategoria] || 0) + t.kwota; });
    return mapa;
  }, [transakcje, poprzedniMiesiacAnalizy]);

  const wydatkiSrednia3M = useMemo(() => {
    const sumy = {};
    trzyPoprzednieMiesiaceAnalizy.forEach((klucz) => {
      transakcje
        .filter((t) => miesiacKlucz(t.data) === klucz && t.typ === "wydatek")
        .forEach((t) => { sumy[t.kategoria] = (sumy[t.kategoria] || 0) + t.kwota; });
    });
    const srednie = {};
    Object.keys(sumy).forEach((k) => { srednie[k] = sumy[k] / 3; });
    return srednie;
  }, [transakcje, miesiacAnalizy]);

  const dniPozostaleAnalizy = useMemo(() => {
    const [rok, mies] = miesiacAnalizy.split("-").map(Number);
    const dniWMiesiacu = new Date(rok, mies, 0).getDate();
    const dzisDzien = new Date().getDate();
    return Math.max(1, dniWMiesiacu - dzisDzien + 1);
  }, [miesiacAnalizy]);

  const spostrzezenia = useMemo(() => {
    const lista = [];

    const wzrosty = Object.entries(wydatkiAnalizyWgKategorii)
      .map(([kat, kwota]) => {
        const srednia = wydatkiSrednia3M[kat] || 0;
        if (srednia < 20) return null;
        const procent = ((kwota - srednia) / srednia) * 100;
        return { kat, procent };
      })
      .filter((x) => x && x.procent >= 15)
      .sort((a, b) => b.procent - a.procent);
    if (wzrosty[0]) {
      lista.push({
        emoji: "💡",
        typ: "info",
        tekst: `W tym miesiącu wydajesz ${Math.round(wzrosty[0].procent)}% więcej na ${wzrosty[0].kat} niż średnio w ostatnich 3 miesiącach.`,
      });
    }

    const spadki = Object.entries(wydatkiAnalizyWgKategorii)
      .map(([kat, kwota]) => {
        const poprzednia = wydatkiPoprzedniAnalizyWgKategorii[kat] || 0;
        if (poprzednia < 20) return null;
        const procent = ((kwota - poprzednia) / poprzednia) * 100;
        return { kat, procent };
      })
      .filter((x) => x && x.procent <= -15)
      .sort((a, b) => a.procent - b.procent);
    if (spadki[0]) {
      lista.push({
        emoji: "🟢",
        typ: "sukces",
        tekst: `Wydatki na ${spadki[0].kat} spadły o ${Math.round(Math.abs(spadki[0].procent))}% względem poprzedniego miesiąca.`,
      });
    }

    const zagrozone = kategorie
      .filter((k) => k.typ === "wydatek" && k.limit != null && k.limit > 0)
      .map((k) => ({ nazwa: k.nazwa, procent: ((wydatkiAnalizyWgKategorii[k.nazwa] || 0) / k.limit) * 100 }))
      .filter((k) => k.procent >= 80)
      .sort((a, b) => b.procent - a.procent);
    if (zagrozone[0]) {
      lista.push({
        emoji: "🟡",
        typ: "ostrzezenie",
        tekst: `Wykorzystałeś już ${Math.round(zagrozone[0].procent)}% budżetu na ${zagrozone[0].nazwa}, a do końca miesiąca zostało ${dniPozostaleAnalizy} ${formaDni(dniPozostaleAnalizy)}.`,
      });
    }

    cele.forEach((cel) => {
      const historia = Array.isArray(cel.historiaWplat) ? cel.historiaWplat : [];
      if (historia.length === 0 || !cel.termin) return;
      const brakuje = Math.max(0, cel.kwotaDocelowa - cel.kwotaOdlozona);
      if (brakuje === 0) return;
      const sugerowana = obliczSugerowanaWplate(cel);
      if (!sugerowana) return;
      const miesiaceZWplatami = new Set(historia.map((w) => miesiacKlucz(w.data))).size || 1;
      const sumaWplat = historia.reduce((s, w) => s + w.kwota, 0);
      const tempoMiesieczne = sumaWplat / miesiaceZWplatami;
      if (tempoMiesieczne <= 0) return;
      const stosunek = tempoMiesieczne / sugerowana;
      if (stosunek >= 1.1) {
        const dniWczesniej = Math.round((brakuje / sugerowana - brakuje / tempoMiesieczne) * 30);
        if (dniWczesniej > 0) {
          lista.push({
            emoji: "💰",
            typ: "cel",
            tekst: `Jeśli utrzymasz obecne tempo wpłat na cel „${cel.nazwa}”, osiągniesz go około ${dniWczesniej} ${formaDni(dniWczesniej)} wcześniej niż zakładany termin.`,
          });
        }
      } else if (stosunek <= 0.9) {
        lista.push({
          emoji: "🟡",
          typ: "ostrzezenie",
          tekst: `Przy obecnym tempie wpłat możesz nie zdążyć z celem „${cel.nazwa}” na czas — warto odkładać ok. ${formatujKwote(sugerowana)}/mies., a obecnie wychodzi ${formatujKwote(tempoMiesieczne)}/mies.`,
        });
      }
    });

    return lista;
  }, [wydatkiAnalizyWgKategorii, wydatkiSrednia3M, wydatkiPoprzedniAnalizyWgKategorii, kategorie, cele, dniPozostaleAnalizy]);

  // Kategorie podzielone na dwie niezależne grupy - wydatki i wpływy.
  const kategorieWydatkow = kategorie.filter((k) => k.typ === "wydatek");
  const kategorieWplywow = kategorie.filter((k) => k.typ === "wplyw");

  // Jedna karta kategorii używana zarówno w grupie wydatków, jak i wpływów -
  // żeby nie powielać tego samego znacznika w dwóch miejscach.
  function renderKategoriaKarta(k) {
    const grupa = k.typ === "wplyw" ? kategorieWplywow : kategorieWydatkow;
    const idxWGrupie = grupa.findIndex((x) => x.id === k.id);
    const wydane = (k.typ === "wplyw" ? wplywyWgKategorii : wydatkiWgKategorii)[k.nazwa] || 0;
    const maLimit = k.typ === "wydatek" && k.limit != null;
    const procent = maLimit ? Math.min(100, (wydane / k.limit) * 100) : 0;
    const przekroczono = maLimit && wydane > k.limit;
    return (
      <div className="bd-kategoria-karta" key={k.id} style={{ "--kat-kolor": k.kolor }}>
        <div className="bd-kategoria-gora">
          <button
            type="button"
            className="bd-kolor-przycisk"
            onClick={() => setEdytowanyKolorId(edytowanyKolorId === k.id ? null : k.id)}
            aria-label={"Zmień kolor kategorii " + k.nazwa}
            aria-expanded={edytowanyKolorId === k.id}
          />
          {edytowanaNazwaId === k.id ? (
            <input
              className="bd-nazwa-input"
              type="text"
              value={edytowanaNazwaWartosc}
              onChange={(e) => setEdytowanaNazwaWartosc(e.target.value)}
              onBlur={() => zapiszNazwe(k.id)}
              onKeyDown={(e) => e.key === "Enter" && zapiszNazwe(k.id)}
              autoFocus
            />
          ) : (
            <span className="bd-kategoria-nazwa">{k.nazwa}</span>
          )}
          <button
            className="bd-usun-mikro bd-przesun-mikro"
            onClick={() => przesunKategorie(k.id, -1)}
            disabled={idxWGrupie === 0}
            aria-label={"Przesuń kategorię " + k.nazwa + " w górę"}
          >
            <ChevronUp size={15} />
          </button>
          <button
            className="bd-usun-mikro bd-przesun-mikro"
            onClick={() => przesunKategorie(k.id, 1)}
            disabled={idxWGrupie === grupa.length - 1}
            aria-label={"Przesuń kategorię " + k.nazwa + " w dół"}
          >
            <ChevronDown size={15} />
          </button>
          <button
            className="bd-usun-mikro"
            onClick={() => (edytowanaNazwaId === k.id ? zapiszNazwe(k.id) : rozpocznijEdycjeNazwy(k))}
            aria-label={"Zmień nazwę kategorii " + k.nazwa}
          >
            {edytowanaNazwaId === k.id ? <Check size={13} /> : <Pencil size={13} />}
          </button>
          <button className="bd-usun-mikro" onClick={() => usunKategorie(k.id)} aria-label={"Usuń kategorię " + k.nazwa}>
            <Trash2 size={13} />
          </button>
        </div>

        {edytowanyKolorId === k.id && (
          <div className="bd-wybor-koloru">
            {PALETA_WYBORU.map((kol) => (
              <button
                key={kol}
                type="button"
                className={"bd-probka-koloru" + (kol.toLowerCase() === k.kolor.toLowerCase() ? " bd-probka-aktywna" : "")}
                style={{ background: kol }}
                onClick={() => zmienKolorKategorii(k.id, kol)}
                aria-label={"Ustaw kolor " + kol}
              />
            ))}
            <label className="bd-wlasny-kolor">
              <input type="color" value={k.kolor} onChange={(e) => zmienKolorKategorii(k.id, e.target.value)} />
              Własny
            </label>
          </div>
        )}

        {k.typ === "wplyw" ? (
          <div className="bd-kategoria-kwoty">
            <span>{formatujKwote(wydane)} otrzymane</span>
          </div>
        ) : maLimit ? (
          <>
            <div className="bd-pasek-tlo">
              <div className={"bd-pasek-wypelnienie" + (przekroczono ? " bd-przekroczony" : "")} style={{ width: procent + "%" }} />
            </div>
            <div className="bd-kategoria-kwoty">
              <span className={przekroczono ? "bd-przekroczony-tekst" : ""}>{formatujKwote(wydane)}</span>
              {edytowanyLimitId === k.id ? (
                <input
                  className="bd-limit-input"
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={edytowanyLimitWartosc}
                  onChange={(e) => setEdytowanyLimitWartosc(e.target.value)}
                  onBlur={() => zapiszLimit(k.id)}
                  onKeyDown={(e) => e.key === "Enter" && zapiszLimit(k.id)}
                />
              ) : (
                <button className="bd-limit-link" onClick={() => { setEdytowanyLimitId(k.id); setEdytowanyLimitWartosc(String(k.limit)); }}>
                  z {formatujKwote(k.limit)}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="bd-kategoria-kwoty">
            <span>{formatujKwote(wydane)} wydane</span>
            {edytowanyLimitId === k.id ? (
              <input
                className="bd-limit-input"
                type="text"
                inputMode="decimal"
                placeholder="Limit zł"
                autoFocus
                value={edytowanyLimitWartosc}
                onChange={(e) => setEdytowanyLimitWartosc(e.target.value)}
                onBlur={() => zapiszLimit(k.id)}
                onKeyDown={(e) => e.key === "Enter" && zapiszLimit(k.id)}
              />
            ) : (
              <button className="bd-limit-link" onClick={() => { setEdytowanyLimitId(k.id); setEdytowanyLimitWartosc(""); }}>
                Ustaw limit
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!gotowe) {
    return (
      <div className="bd-app">
        <style>{STYLE}</style>
        <div className="bd-ladowanie">Otwieram zeszyt…</div>
      </div>
    );
  }

  return (
    <div className="bd-app">
      <style>{STYLE}</style>

      <header className="bd-header">
        <div className="bd-okres-przelacznik">
          <button
            type="button"
            className={trybOkresu === "miesiac" ? "bd-aktywny" : ""}
            onClick={() => setTrybOkresu("miesiac")}
          >
            Miesiąc
          </button>
          <button
            type="button"
            className={trybOkresu === "wlasny" ? "bd-aktywny" : ""}
            onClick={wlaczWlasnyOkres}
          >
            Własny okres
          </button>
        </div>

        {trybOkresu === "miesiac" ? (
          <div className="bd-miesiac-nav">
            <button className="bd-strzalka" onClick={() => zmienMiesiac(-1)} aria-label="Poprzedni miesiąc">
              <ChevronLeft size={18} />
            </button>
            <h1>{tytulMiesiaca}</h1>
            <button className="bd-strzalka" onClick={() => zmienMiesiac(1)} aria-label="Następny miesiąc">
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="bd-okres-daty">
            <input
              type="date"
              value={wlasnyOd}
              onChange={(e) => setWlasnyOd(e.target.value)}
              aria-label="Data od"
            />
            <span className="bd-okres-lacznik">–</span>
            <input
              type="date"
              value={wlasnyDo}
              onChange={(e) => setWlasnyDo(e.target.value)}
              aria-label="Data do"
            />
          </div>
        )}

        <div className="bd-staty">
          <div className="bd-stat">
            <span className="bd-stat-etykieta">Wpływy</span>
            <span className="bd-stat-liczba bd-zielony">{formatujKwote(wplywy)}</span>
          </div>
          <div className="bd-stat">
            <span className="bd-stat-etykieta">Wydatki</span>
            <span className="bd-stat-liczba bd-czerwony">{formatujKwote(wydatki)}</span>
          </div>
          <div className="bd-stat bd-stat-bilans">
            <span className="bd-stat-etykieta">Bilans</span>
            <span className={"bd-stat-liczba " + (bilans < 0 ? "bd-czerwony" : "bd-zielony")}>
              {bilans >= 0 ? "+" : ""}{formatujKwote(bilans)}
            </span>
          </div>
        </div>
      </header>

      <nav className="bd-tabnav">
        {KLUCZE_ZAKLADEK.map((klucz) => (
          <button
            key={klucz}
            type="button"
            className={widok === klucz ? "bd-aktywny" : ""}
            onClick={() => setWidok(klucz)}
          >
            {wielka(nazwyZakladek[klucz])}
          </button>
        ))}
      </nav>

      <div className="bd-zakladki-akcje">
        <button type="button" className="bd-dodaj-kategorie-link bd-zakladki-link" onClick={otworzEdycjeZakladek}>
          <Settings2 size={13} /> Zmień nazwy zakładek
        </button>
      </div>

      {edycjaZakladekOtwarta && (
        <div className="bd-edycja-zakladek">
          {KLUCZE_ZAKLADEK.map((klucz) => (
            <div className="bd-edycja-zakladek-wiersz" key={klucz}>
              <span className="bd-edycja-zakladek-etykieta">{DOMYSLNE_NAZWY_ZAKLADEK[klucz]}</span>
              <input
                type="text"
                value={roboczeNazwyZakladek[klucz]}
                onChange={(e) => zmienNazweZakladkiRoboczej(klucz, e.target.value)}
                maxLength={16}
              />
            </div>
          ))}
          <div className="bd-formularz-kategorii-przyciski">
            <button type="button" onClick={zapiszEdycjeZakladek}>Zapisz</button>
            <button type="button" onClick={anulujEdycjeZakladek}>Anuluj</button>
          </div>
        </div>
      )}

      {widok === "przeglad" && (
        <section className="bd-dashboard">
          <div className="bd-dash-hero">
            <span className="bd-dash-hero-etykieta"><Wallet size={16} /> Możesz jeszcze wydać</span>
            {kwotaDziennie != null ? (
              <>
                <span className="bd-dash-hero-liczba">
                  {formatujKwote(kwotaDziennie)}
                  <span className="bd-dash-hero-dzien"> / dzień</span>
                </span>
                <span className="bd-dash-hero-podpis">
                  {formatujKwote(pozostalyBudzet)} do końca miesiąca · {dniPozostale} {formaDni(dniPozostale)} pozostało
                  {sumaMiesiecznychWplatNaCele > 0 && (
                    <> · po odłożeniu {formatujKwote(sumaMiesiecznychWplatNaCele)} na cele</>
                  )}
                </span>
              </>
            ) : czyBiezacyMiesiac ? (
              <span className="bd-dash-hero-podpis">
                {pozostalyBudzet < 0
                  ? <>Budżet na ten miesiąc jest przekroczony o {formatujKwote(Math.abs(pozostalyBudzet))}{sumaMiesiecznychWplatNaCele > 0 ? " (uwzględniając wpłaty na cele)" : ""}.</>
                  : <>Bilans jest na zero — nic nie zostaje na wydatki poza planem.</>}
              </span>
            ) : (
              <span className="bd-dash-hero-podpis">
                Bilans wybranego okresu: {bilans >= 0 ? "+" : ""}{formatujKwote(bilans)}. Ta prognoza działa dla bieżącego miesiąca.
              </span>
            )}
          </div>

          <div className="bd-dash-siatka">
            <div className="bd-dash-karta">
              <span className="bd-dash-etykieta">Wykorzystanie budżetu</span>
              {wykorzystanieProcent != null ? (
                <>
                  <span className="bd-dash-liczba">{Math.round(wykorzystanieProcent)}%</span>
                  <div className="bd-pasek-tlo">
                    <div
                      className="bd-pasek-wypelnienie"
                      style={{
                        width: Math.min(100, wykorzystanieProcent) + "%",
                        background: wykorzystanieProcent > 100 ? "var(--czerwony)" : "var(--ink)",
                      }}
                    />
                  </div>
                </>
              ) : (
                <span className="bd-dash-podpis">Brak ustawionych limitów</span>
              )}
            </div>

            <div className="bd-dash-karta">
              <span className="bd-dash-etykieta"><Crown size={13} /> Największa kategoria</span>
              {najwiekszaKategoria ? (
                <>
                  <span className="bd-dash-liczba" style={{ color: kolorKategorii(najwiekszaKategoria[0]) }}>
                    {najwiekszaKategoria[0]}
                  </span>
                  <span className="bd-dash-podpis">{formatujKwote(najwiekszaKategoria[1])}</span>
                </>
              ) : (
                <span className="bd-dash-podpis">Brak wydatków w tym okresie</span>
              )}
            </div>

            <div className="bd-dash-karta">
              <span className="bd-dash-etykieta"><Flame size={13} /> Największy wydatek</span>
              {najwiekszyWydatek ? (
                <>
                  <span className="bd-dash-liczba">{formatujKwote(najwiekszyWydatek.kwota)}</span>
                  <span className="bd-dash-podpis">
                    {najwiekszyWydatek.kategoria}
                    {najwiekszyWydatek.opis ? " · " + najwiekszyWydatek.opis : ""}
                  </span>
                </>
              ) : (
                <span className="bd-dash-podpis">Brak wydatków w tym okresie</span>
              )}
            </div>

            <div className="bd-dash-karta">
              <span className="bd-dash-etykieta"><CalendarDays size={13} /> Do końca miesiąca</span>
              {czyBiezacyMiesiac ? (
                <span className="bd-dash-liczba">{dniPozostale} {formaDni(dniPozostale)}</span>
              ) : (
                <span className="bd-dash-podpis">Dotyczy bieżącego miesiąca</span>
              )}
            </div>
          </div>
        </section>
      )}

      {widok === "przeglad" && trybOkresu === "miesiac" && (
        <section className="bd-porownanie-sekcja">
          <div className="bd-sekcja-naglowek">
            <h2>Porównanie z poprzednim miesiącem</h2>
          </div>

          {!czyIstniejaDanePoprzednie ? (
            <p className="bd-pusto">Brak danych z poprzedniego miesiąca do porównania.</p>
          ) : (
            <>
              <p className="bd-porownanie-komunikat">
                {wydatkiPoprzedniSuma === 0 && wydatki === 0 ? (
                  "Brak wydatków w tym i poprzednim miesiącu."
                ) : wydatkiPoprzedniSuma === 0 ? (
                  "W tym miesiącu pojawiły się wydatki — w poprzednim miesiącu ich nie było."
                ) : (
                  <>
                    W tym miesiącu wydajesz{" "}
                    <strong className={zmianaCalkowitaProcent <= 0 ? "bd-zielony" : "bd-czerwony"}>
                      {Math.round(Math.abs(zmianaCalkowitaProcent))}%
                    </strong>{" "}
                    {zmianaCalkowitaProcent <= 0 ? "mniej" : "więcej"} niż w poprzednim miesiącu.
                  </>
                )}
              </p>

              {listaPorownaniaKategorii.length > 0 && (
                <div className="bd-porownanie-tabela">
                  <div className="bd-porownanie-wiersz bd-porownanie-naglowek">
                    <span></span>
                    <span>{skrocMiesiac(MIESIACE[poprzedniMiesWyb - 1])}</span>
                    <span>{skrocMiesiac(MIESIACE[miesWyb - 1])}</span>
                    <span>Zmiana</span>
                  </div>
                  {listaPorownaniaKategorii.map((k) => (
                    <div className="bd-porownanie-wiersz" key={k.nazwa} style={{ "--kat-kolor": kolorKategorii(k.nazwa) }}>
                      <span className="bd-porownanie-kategoria">
                        <span className="bd-kategoria-kropka" />
                        {k.nazwa}
                      </span>
                      <span>{formatujKwote(k.poprzednia)}</span>
                      <span>{formatujKwote(k.aktualna)}</span>
                      <span
                        className={
                          k.roznicaProcent == null || k.roznicaProcent === 0
                            ? "bd-porownanie-brak"
                            : k.roznicaProcent > 0
                            ? "bd-czerwony"
                            : "bd-zielony"
                        }
                      >
                        {k.roznicaProcent == null ? "Nowe" : (k.roznicaProcent >= 0 ? "+" : "") + Math.round(k.roznicaProcent) + "%"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {widok === "zapisy" && (
      <>
      <form className={"bd-formularz" + (edytowanaTransakcjaId ? " bd-formularz-edycja" : "")} onSubmit={dodajTransakcje}>
        {edytowanaTransakcjaId && <div className="bd-edycja-etykieta"><Pencil size={12} /> Edytujesz wpis</div>}
        <div className="bd-przelacznik">
          <button type="button" className={typ === "wydatek" ? "bd-aktywny" : ""} onClick={() => zmienTypFormularza("wydatek")}>
            Wydatek
          </button>
          <button type="button" className={typ === "wplyw" ? "bd-aktywny" : ""} onClick={() => zmienTypFormularza("wplyw")}>
            Wpływ
          </button>
        </div>

        <div className="bd-pola">
          <input
            className="bd-pole-kwota"
            type="text"
            inputMode="decimal"
            placeholder="0,00 zł"
            value={kwota}
            onChange={(e) => setKwota(e.target.value)}
            required
          />
          <select value={pokazNowaKatWForm ? NOWA_KATEGORIA_ZNACZNIK : kategoria} onChange={(e) => obslugaZmianyKategoriiWForm(e.target.value)}>
            {kategorie.filter((k) => k.typ === typ).map((k) => (
              <option key={k.id} value={k.nazwa}>{k.nazwa}</option>
            ))}
            <option value={NOWA_KATEGORIA_ZNACZNIK}>+ Nowa kategoria…</option>
          </select>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </div>

        {pokazNowaKatWForm && (
          <div className="bd-nowa-kat-inline">
            <input
              type="text"
              placeholder="Nazwa nowej kategorii"
              value={nowaKatNazwaForm}
              onChange={(e) => setNowaKatNazwaForm(e.target.value)}
              autoFocus
            />
            {typ === "wydatek" && (
              <input
                type="text"
                inputMode="decimal"
                placeholder="Limit zł (opcjonalnie)"
                value={nowaKatLimitForm}
                onChange={(e) => setNowaKatLimitForm(e.target.value)}
              />
            )}
          </div>
        )}

        <input
          className="bd-pole-opis"
          type="text"
          placeholder="Notatka (opcjonalnie)"
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
        />

        <button type="submit" className="bd-przycisk-dodaj">
          {edytowanaTransakcjaId ? <><Check size={17} /> Zapisz zmiany</> : <><Plus size={17} /> Dodaj wpis</>}
        </button>
        {edytowanaTransakcjaId && (
          <button type="button" className="bd-anuluj-edycje" onClick={anulujEdycjeTransakcji}>
            Anuluj edycję
          </button>
        )}
      </form>

      <div className="bd-siatka">
        <section className="bd-kategorie-sekcja">
          <div className="bd-sekcja-naglowek">
            <Tag size={15} />
            <h2>Kategorie wydatków</h2>
          </div>

          <div className="bd-lista-kategorii">
            {kategorieWydatkow.map(renderKategoriaKarta)}
          </div>

          {formularzKategoriiTyp === "wydatek" ? (
            <form className="bd-formularz-kategorii" onSubmit={(e) => dodajKategorie(e, "wydatek")}>
              <label className="bd-wlasny-kolor bd-nowa-kat-kolor">
                <input
                  type="color"
                  value={nowaKategoriaKolor || kolejnyKolor(kategorieWydatkow)}
                  onChange={(e) => setNowaKategoriaKolor(e.target.value)}
                />
                Kolor kategorii
              </label>
              <input
                type="text"
                placeholder="Nazwa kategorii"
                value={nowaKategoriaNazwa}
                onChange={(e) => setNowaKategoriaNazwa(e.target.value)}
                autoFocus
                required
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Limit zł (opcjonalnie)"
                value={nowaKategoriaLimit}
                onChange={(e) => setNowaKategoriaLimit(e.target.value)}
              />
              <div className="bd-formularz-kategorii-przyciski">
                <button type="submit">Dodaj</button>
                <button type="button" onClick={() => setFormularzKategoriiTyp(null)}>Anuluj</button>
              </div>
            </form>
          ) : (
            <button className="bd-dodaj-kategorie-link" onClick={() => { setFormularzKategoriiTyp("wydatek"); setNowaKategoriaKolor(null); }}>
              + Nowa kategoria wydatków
            </button>
          )}

          <div className="bd-sekcja-naglowek bd-sekcja-naglowek-druga">
            <Tag size={15} />
            <h2>Kategorie wpływów</h2>
          </div>

          <div className="bd-lista-kategorii">
            {kategorieWplywow.map(renderKategoriaKarta)}
          </div>

          {formularzKategoriiTyp === "wplyw" ? (
            <form className="bd-formularz-kategorii" onSubmit={(e) => dodajKategorie(e, "wplyw")}>
              <label className="bd-wlasny-kolor bd-nowa-kat-kolor">
                <input
                  type="color"
                  value={nowaKategoriaKolor || kolejnyKolor(kategorieWplywow)}
                  onChange={(e) => setNowaKategoriaKolor(e.target.value)}
                />
                Kolor kategorii
              </label>
              <input
                type="text"
                placeholder="Nazwa kategorii"
                value={nowaKategoriaNazwa}
                onChange={(e) => setNowaKategoriaNazwa(e.target.value)}
                autoFocus
                required
              />
              <div className="bd-formularz-kategorii-przyciski">
                <button type="submit">Dodaj</button>
                <button type="button" onClick={() => setFormularzKategoriiTyp(null)}>Anuluj</button>
              </div>
            </form>
          ) : (
            <button className="bd-dodaj-kategorie-link" onClick={() => { setFormularzKategoriiTyp("wplyw"); setNowaKategoriaKolor(null); }}>
              + Nowa kategoria wpływów
            </button>
          )}
        </section>

        <section className="bd-zapisy-sekcja">
          <h2>Zapisy</h2>
          {transakcjeWgDnia.length === 0 ? (
            <p className="bd-pusto">Brak zapisów w tym miesiącu. Dodaj pierwszy wpis powyżej.</p>
          ) : (
            transakcjeWgDnia.map(([dzien, wpisy]) => (
              <div className="bd-grupa-dnia" key={dzien}>
                <div className="bd-data-naglowek">
                  {new Date(dzien + "T00:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}
                </div>
                {wpisy.map((t) => (
                  <div
                    className="bd-wiersz"
                    key={t.id}
                    style={{ "--kat-kolor": kolorKategorii(t.kategoria, t.typ) }}
                  >
                    <div className="bd-wiersz-opis">
                      <span className="bd-wiersz-kategoria">{t.kategoria}</span>
                      {t.opis && <span className="bd-wiersz-notatka">{t.opis}</span>}
                    </div>
                    <span className={"bd-wiersz-kwota " + (t.typ === "wplyw" ? "bd-dodatnia" : "bd-ujemna")}>
                      {t.typ === "wplyw" ? "+" : "−"}{formatujKwote(t.kwota)}
                    </span>
                    <button className="bd-usun-mikro" onClick={() => rozpocznijEdycjeTransakcji(t)} aria-label="Edytuj wpis">
                      <Pencil size={13} />
                    </button>
                    <button className="bd-usun-mikro" onClick={() => usunTransakcje(t.id)} aria-label="Usuń wpis">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      </div>

      {Object.keys(wydatkiWgKategorii).length > 0 && (
        <section className="bd-rozklad-sekcja">
          <h2>Wydatki według kategorii</h2>
          <div className="bd-wykres">
            {Object.entries(wydatkiWgKategorii)
              .sort((a, b) => b[1] - a[1])
              .map(([nazwa, kwotaKat]) => (
                <div className="bd-wykres-wiersz" key={nazwa}>
                  <span className="bd-wykres-etykieta">{nazwa}</span>
                  <div className="bd-wykres-pasek-tlo">
                    <div
                      className="bd-wykres-pasek"
                      style={{ width: (kwotaKat / maxKategoria) * 100 + "%", background: kolorKategorii(nazwa) }}
                    />
                  </div>
                  <span className="bd-wykres-kwota">{formatujKwote(kwotaKat)}</span>
                </div>
              ))}
          </div>
        </section>
      )}
      </>
      )}

      {widok === "cele" && (
        <section className="bd-cele-sekcja">
          <div className="bd-sekcja-naglowek">
            <h2>Cele oszczędnościowe</h2>
          </div>

          {cele.length === 0 ? (
            <p className="bd-pusto">Nie masz jeszcze żadnych celów. Dodaj pierwszy poniżej.</p>
          ) : (
            <div className="bd-lista-celow">
              {cele.map((cel) => {
                const procent = Math.min(100, (cel.kwotaOdlozona / cel.kwotaDocelowa) * 100);
                const brakuje = Math.max(0, cel.kwotaDocelowa - cel.kwotaOdlozona);
                const ukonczony = brakuje === 0;
                const sugerowanaWplata = obliczSugerowanaWplate(cel);
                const terminMinal = cel.termin && !ukonczony && sugerowanaWplata == null;
                return (
                  <div className="bd-cel-karta" key={cel.id} style={{ "--kat-kolor": cel.kolor }}>
                    <div className="bd-kategoria-gora">
                      <span className="bd-cel-emoji">{cel.emoji}</span>
                      <span className="bd-kategoria-nazwa">{cel.nazwa}</span>
                      <button className="bd-usun-mikro" onClick={() => rozpocznijEdycjeCelu(cel)} aria-label={"Edytuj cel " + cel.nazwa}>
                        <Pencil size={13} />
                      </button>
                      <button className="bd-usun-mikro" onClick={() => usunCel(cel.id)} aria-label={"Usuń cel " + cel.nazwa}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="bd-cel-kwoty-glowne">
                      <span className="bd-cel-odlozone">{formatujKwote(cel.kwotaOdlozona)}</span>
                      <span className="bd-cel-docelowe"> / {formatujKwote(cel.kwotaDocelowa)}</span>
                    </div>

                    <div className="bd-pasek-tlo">
                      <div className="bd-pasek-wypelnienie" style={{ width: procent + "%" }} />
                    </div>
                    <div className="bd-cel-procent">{Math.round(procent)}%</div>

                    {ukonczony ? (
                      <p className="bd-cel-info bd-cel-sukces">Cel osiągnięty! 🎉</p>
                    ) : (
                      <p className="bd-cel-info">
                        Brakuje {formatujKwote(brakuje)}.
                        {cel.termin && sugerowanaWplata != null && (
                          <> Warto odkładać ok. {formatujKwote(sugerowanaWplata)}/mies. do {formatujDate(cel.termin)}.</>
                        )}
                        {terminMinal && <> Termin ({formatujDate(cel.termin)}) minął.</>}
                      </p>
                    )}

                    {edytowanaWplataId === cel.id ? (
                      <div className="bd-cel-wplata-form">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Kwota zł"
                          value={edytowanaWplataWartosc}
                          onChange={(e) => setEdytowanaWplataWartosc(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && zapiszWplate(cel.id)}
                          autoFocus
                        />
                        <button type="button" onClick={() => zapiszWplate(cel.id)}>Wpłać</button>
                        <button type="button" onClick={() => setEdytowanaWplataId(null)}>Anuluj</button>
                      </div>
                    ) : (
                      <button
                        className="bd-dodaj-kategorie-link"
                        onClick={() => { setEdytowanaWplataId(cel.id); setEdytowanaWplataWartosc(""); }}
                      >
                        + Dodaj wpłatę
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {pokazFormularzCelu ? (
            <form className="bd-formularz-kategorii bd-formularz-celu" onSubmit={dodajCel}>
              {edytowanyCelId && <div className="bd-edycja-etykieta"><Pencil size={12} /> Edytujesz cel</div>}
              <div className="bd-formularz-celu-rzad">
                <input
                  type="text"
                  placeholder="Emoji"
                  value={nowyCelEmoji}
                  onChange={(e) => setNowyCelEmoji(e.target.value)}
                  className="bd-cel-emoji-input"
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="Nazwa celu"
                  value={nowyCelNazwa}
                  onChange={(e) => setNowyCelNazwa(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="bd-formularz-celu-rzad">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Kwota docelowa zł"
                  value={nowyCelDocelowa}
                  onChange={(e) => setNowyCelDocelowa(e.target.value)}
                  required
                />
                {!edytowanyCelId && (
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Już odłożone (opcj.)"
                    value={nowyCelPoczatkowa}
                    onChange={(e) => setNowyCelPoczatkowa(e.target.value)}
                  />
                )}
              </div>
              <input
                type="date"
                value={nowyCelTermin}
                onChange={(e) => setNowyCelTermin(e.target.value)}
              />
              <div className="bd-formularz-kategorii-przyciski">
                <button type="submit">{edytowanyCelId ? "Zapisz zmiany" : "Dodaj cel"}</button>
                <button type="button" onClick={anulujFormularzCelu}>Anuluj</button>
              </div>
            </form>
          ) : (
            <button className="bd-dodaj-kategorie-link" onClick={() => setPokazFormularzCelu(true)}>
              + Nowy cel
            </button>
          )}
        </section>
      )}

      {widok === "cykliczne" && (
        <section className="bd-cykliczne-sekcja">
          <div className="bd-sekcja-naglowek">
            <h2>Nadchodzące</h2>
          </div>

          {nadchodzace.length === 0 ? (
            <p className="bd-pusto">Brak zdefiniowanych transakcji cyklicznych.</p>
          ) : (
            <div className="bd-lista-nadchodzacych">
              {nadchodzace.map((item) => (
                <div className="bd-nadchodzacy-wiersz" key={item.id} style={{ "--kat-kolor": item.kolor }}>
                  <div className="bd-nadchodzacy-info">
                    <span className="bd-nadchodzacy-etykieta">
                      {item.dni === 1 ? "Jutro" : `Za ${item.dni} ${formaDni(item.dni)}`}
                    </span>
                    <span className="bd-nadchodzacy-nazwa">{item.nazwa}</span>
                  </div>
                  <span className={"bd-wiersz-kwota " + (item.typ === "wplyw" ? "bd-dodatnia" : "bd-ujemna")}>
                    {item.typ === "wplyw" ? "+" : "−"}{formatujKwote(item.kwota)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="bd-sekcja-naglowek bd-sekcja-naglowek-druga">
            <h2>Zdefiniowane</h2>
          </div>

          {cykliczne.length === 0 ? (
            <p className="bd-pusto">Nie masz jeszcze żadnych transakcji cyklicznych.</p>
          ) : (
            <div className="bd-lista-cyklicznych">
              {cykliczne.map((cykl) => (
                <div className="bd-cykl-karta" key={cykl.id} style={{ "--kat-kolor": kolorKategorii(cykl.kategoria, cykl.typ) }}>
                  <div className="bd-kategoria-gora">
                    <span className="bd-kategoria-nazwa">{cykl.nazwa}</span>
                    <button className="bd-usun-mikro" onClick={() => rozpocznijEdycjeCyklu(cykl)} aria-label={"Edytuj " + cykl.nazwa}>
                      <Pencil size={13} />
                    </button>
                    <button className="bd-usun-mikro" onClick={() => usunCykliczna(cykl.id)} aria-label={"Usuń " + cykl.nazwa}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="bd-cykl-szczegoly">
                    <span className={cykl.typ === "wplyw" ? "bd-zielony" : "bd-czerwony"}>
                      {cykl.typ === "wplyw" ? "+" : "−"}{formatujKwote(cykl.kwota)}
                    </span>
                    <span className="bd-cykl-opis-tekst">{cykl.kategoria} · {opisCzestotliwosci(cykl)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pokazFormularzCyklu ? (
            <form className="bd-formularz-kategorii bd-formularz-celu" onSubmit={dodajCykliczna}>
              {edytowanyCyklId && <div className="bd-edycja-etykieta"><Pencil size={12} /> Edytujesz transakcję cykliczną</div>}
              <div className="bd-przelacznik">
                <button type="button" className={nowyCyklTyp === "wydatek" ? "bd-aktywny" : ""} onClick={() => zmienNowyCyklTyp("wydatek")}>
                  Wydatek
                </button>
                <button type="button" className={nowyCyklTyp === "wplyw" ? "bd-aktywny" : ""} onClick={() => zmienNowyCyklTyp("wplyw")}>
                  Wpływ
                </button>
              </div>

              <input
                type="text"
                placeholder="Nazwa (np. czynsz, wynagrodzenie)"
                value={nowyCyklNazwa}
                onChange={(e) => setNowyCyklNazwa(e.target.value)}
                autoFocus
                required
              />

              <div className="bd-formularz-celu-rzad">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Kwota zł"
                  value={nowyCyklKwota}
                  onChange={(e) => setNowyCyklKwota(e.target.value)}
                  required
                />
                <select value={nowyCyklKategoria} onChange={(e) => setNowyCyklKategoria(e.target.value)}>
                  {kategorie.filter((k) => k.typ === nowyCyklTyp).map((k) => (
                    <option key={k.id} value={k.nazwa}>{k.nazwa}</option>
                  ))}
                </select>
              </div>

              <select value={nowyCyklCzestotliwosc} onChange={(e) => setNowyCyklCzestotliwosc(e.target.value)}>
                <option value="miesiecznie">Co miesiąc</option>
                <option value="tygodniowo">Co tydzień</option>
                <option value="rocznie">Raz w roku</option>
              </select>

              {nowyCyklCzestotliwosc === "tygodniowo" && (
                <select value={nowyCyklDzienTygodnia} onChange={(e) => setNowyCyklDzienTygodnia(e.target.value)}>
                  {DNI_TYGODNIA.map((nazwa, idx) => (
                    <option key={idx} value={idx}>{nazwa}</option>
                  ))}
                </select>
              )}

              {(nowyCyklCzestotliwosc === "miesiecznie" || nowyCyklCzestotliwosc === "rocznie") && (
                <div className="bd-formularz-celu-rzad">
                  {nowyCyklCzestotliwosc === "rocznie" && (
                    <select value={nowyCyklMiesiacRoku} onChange={(e) => setNowyCyklMiesiacRoku(e.target.value)}>
                      {MIESIACE.map((nazwa, idx) => (
                        <option key={idx} value={idx + 1}>{nazwa}</option>
                      ))}
                    </select>
                  )}
                  <select value={nowyCyklDzienMiesiaca} onChange={(e) => setNowyCyklDzienMiesiaca(e.target.value)}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}. dnia</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bd-formularz-kategorii-przyciski">
                <button type="submit">{edytowanyCyklId ? "Zapisz zmiany" : "Dodaj"}</button>
                <button type="button" onClick={anulujFormularzCyklu}>Anuluj</button>
              </div>
            </form>
          ) : (
            <button className="bd-dodaj-kategorie-link" onClick={() => setPokazFormularzCyklu(true)}>
              + Nowa transakcja cykliczna
            </button>
          )}
        </section>
      )}

      {widok === "rok" && (
        <section className="bd-rok-sekcja">
          <div className="bd-rok-nav">
            <button className="bd-strzalka" onClick={() => setWybranyRok((r) => r - 1)} aria-label="Poprzedni rok">
              <ChevronLeft size={18} />
            </button>
            <h1 className="bd-rok-tytul">{wybranyRok}</h1>
            <button className="bd-strzalka" onClick={() => setWybranyRok((r) => r + 1)} aria-label="Następny rok">
              <ChevronRight size={18} />
            </button>
          </div>

          {transakcjeRoku.length === 0 ? (
            <p className="bd-pusto">Brak zapisów w {wybranyRok} roku.</p>
          ) : (
            <>
              <div className="bd-dash-siatka bd-rok-siatka">
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta">Wpływy w roku</span>
                  <span className="bd-dash-liczba bd-zielony">{formatujKwote(wplywyRoczne)}</span>
                </div>
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta">Wydatki w roku</span>
                  <span className="bd-dash-liczba bd-czerwony">{formatujKwote(wydatkiRoczne)}</span>
                </div>
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta">Bilans roczny</span>
                  <span className={"bd-dash-liczba " + (bilansRoczny < 0 ? "bd-czerwony" : "bd-zielony")}>
                    {bilansRoczny >= 0 ? "+" : ""}{formatujKwote(bilansRoczny)}
                  </span>
                </div>
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta">Średnio / miesiąc</span>
                  <span className="bd-dash-liczba">{formatujKwote(srednieWydatkiMiesieczne)}</span>
                  <span className="bd-dash-podpis">Wydatków · {formatujKwote(srednieWplywyMiesieczne)} wpływów</span>
                </div>
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta"><Crown size={13} /> Największa kategoria</span>
                  {najwiekszaKategoriaRoku ? (
                    <>
                      <span className="bd-dash-liczba" style={{ color: kolorKategorii(najwiekszaKategoriaRoku[0]) }}>
                        {najwiekszaKategoriaRoku[0]}
                      </span>
                      <span className="bd-dash-podpis">{formatujKwote(najwiekszaKategoriaRoku[1])}</span>
                    </>
                  ) : (
                    <span className="bd-dash-podpis">Brak wydatków</span>
                  )}
                </div>
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta"><Flame size={13} /> Największy wydatek</span>
                  {najwiekszyWydatekRoku ? (
                    <>
                      <span className="bd-dash-liczba">{formatujKwote(najwiekszyWydatekRoku.kwota)}</span>
                      <span className="bd-dash-podpis">{najwiekszyWydatekRoku.kategoria}</span>
                    </>
                  ) : (
                    <span className="bd-dash-podpis">Brak wydatków</span>
                  )}
                </div>
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta">Najlepszy miesiąc</span>
                  {najlepszyMiesiacRoku ? (
                    <>
                      <span className="bd-dash-liczba bd-zielony">{MIESIACE[najlepszyMiesiacRoku.miesiac - 1]}</span>
                      <span className="bd-dash-podpis">Bilans {najlepszyMiesiacRoku.bilans >= 0 ? "+" : ""}{formatujKwote(najlepszyMiesiacRoku.bilans)}</span>
                    </>
                  ) : (
                    <span className="bd-dash-podpis">Brak danych</span>
                  )}
                </div>
                <div className="bd-dash-karta">
                  <span className="bd-dash-etykieta">Najdroższy miesiąc</span>
                  {najdrozszyMiesiacRoku ? (
                    <>
                      <span className="bd-dash-liczba bd-czerwony">{MIESIACE[najdrozszyMiesiacRoku.miesiac - 1]}</span>
                      <span className="bd-dash-podpis">Wydatki {formatujKwote(najdrozszyMiesiacRoku.wydatki)}</span>
                    </>
                  ) : (
                    <span className="bd-dash-podpis">Brak danych</span>
                  )}
                </div>
              </div>

              <div className="bd-sekcja-naglowek bd-sekcja-naglowek-druga">
                <h2>Wpływy i wydatki w miesiącach</h2>
              </div>
              <div className="bd-rok-wykres">
                {miesieczneDaneRoku.map((m) => (
                  <div className="bd-rok-miesiac-wiersz" key={m.miesiac}>
                    <span className="bd-rok-miesiac-etykieta">{skrocMiesiac(MIESIACE[m.miesiac - 1])}</span>
                    <div className="bd-rok-paski">
                      <div className="bd-rok-pasek-tlo">
                        <div className="bd-rok-pasek bd-rok-pasek-wplyw" style={{ width: (m.wplywy / maxWMiesiacuRoku) * 100 + "%" }} />
                      </div>
                      <div className="bd-rok-pasek-tlo">
                        <div className="bd-rok-pasek bd-rok-pasek-wydatek" style={{ width: (m.wydatki / maxWMiesiacuRoku) * 100 + "%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rankingKategoriiRoku.length > 0 && (
                <>
                  <div className="bd-sekcja-naglowek bd-sekcja-naglowek-druga">
                    <h2>Ranking kategorii</h2>
                  </div>
                  <div className="bd-rok-ranking">
                    {rankingKategoriiRoku.map(([nazwa, kwota], idx) => (
                      <div className="bd-rok-ranking-wiersz" key={nazwa} style={{ "--kat-kolor": kolorKategorii(nazwa) }}>
                        <span className="bd-rok-medal">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1 + "."}</span>
                        <span className="bd-rok-ranking-nazwa">{nazwa}</span>
                        <span className="bd-rok-ranking-kwota">{formatujKwote(kwota)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}

      {widok === "analiza" && (
        <section className="bd-analiza-sekcja">
          <div className="bd-sekcja-naglowek">
            <h2>Analiza</h2>
          </div>
          <p className="bd-dane-info">
            Spostrzeżenia liczone wyłącznie na podstawie Twoich rzeczywistych zapisów — bez zgadywania.
          </p>

          {spostrzezenia.length === 0 ? (
            <p className="bd-pusto">
              Brak szczególnych spostrzeżeń w tym miesiącu — wydatki wyglądają stabilnie względem ostatnich miesięcy.
            </p>
          ) : (
            <div className="bd-analiza-lista">
              {spostrzezenia.map((s, idx) => (
                <div className={"bd-analiza-karta bd-analiza-" + s.typ} key={idx}>
                  <span className="bd-analiza-emoji">{s.emoji}</span>
                  <span className="bd-analiza-tekst">{s.tekst}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {widok === "dane" && (
        <section className="bd-dane-sekcja">
          <div className="bd-sekcja-naglowek">
            <h2>Dane i kopia zapasowa</h2>
          </div>

          <p className="bd-dane-statystyki">
            {transakcje.length} zapisów · {kategorie.length} kategorii · {cele.length} celów · {cykliczne.length} cyklicznych
          </p>

          <div className="bd-dane-przyciski">
            <button type="button" className="bd-dane-przycisk" onClick={eksportujCSV}>
              <Download size={15} /> Eksportuj zapisy (CSV)
            </button>
            <button type="button" className="bd-dane-przycisk" onClick={eksportujJSON}>
              <Download size={15} /> Eksportuj pełną kopię (JSON)
            </button>
          </div>

          <div className="bd-sekcja-naglowek bd-sekcja-naglowek-druga">
            <h2>Przywracanie danych</h2>
          </div>
          <p className="bd-dane-info">
            Import zastąpi wszystkie obecne dane w aplikacji plikiem kopii zapasowej JSON wyeksportowanym wcześniej z tej aplikacji.
          </p>
          <label className="bd-dane-import-etykieta">
            <Upload size={15} /> Wybierz plik JSON
            <input type="file" accept="application/json" onChange={obslugaImportu} className="bd-dane-import-input" />
          </label>

          {bladImportu && <p className="bd-dane-blad">{bladImportu}</p>}
          {komunikatDanych && !importDoZatwierdzenia && <p className="bd-dane-sukces">{komunikatDanych}</p>}

          {importDoZatwierdzenia && (
            <div className="bd-dane-potwierdzenie">
              <p>
                Ten plik zawiera {Array.isArray(importDoZatwierdzenia.transakcje) ? importDoZatwierdzenia.transakcje.length : 0} zapisów.
                Import <strong>zastąpi</strong> wszystkie obecne dane w aplikacji. Tej operacji nie można cofnąć.
              </p>
              <div className="bd-formularz-kategorii-przyciski">
                <button type="button" onClick={zatwierdzImport}>Tak, zastąp dane</button>
                <button type="button" onClick={anulujImport}>Anuluj</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700;800&display=swap');

.bd-app {
  --paper: #FAF8F1;
  --card: #FFFFFF;
  --kratka: rgba(94, 128, 173, 0.16);
  --margines: rgba(178, 62, 52, 0.38);
  --ink: #17213A;
  --ink-muted: #565F78;
  --line: rgba(23, 33, 58, 0.13);
  --zielony: #1F6E4C;
  --czerwony: #A23B2D;
  --focus: #2E6F9E;

  position: relative;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  background-color: var(--paper);
  background-image:
    linear-gradient(var(--kratka) 1px, transparent 1px),
    linear-gradient(90deg, var(--kratka) 1px, transparent 1px);
  background-size: 24px 24px, 24px 24px;
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 16px 40px 40px;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}
.bd-app::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 24px;
  width: 1.5px;
  background: var(--margines);
}
.bd-app * { box-sizing: border-box; }

.bd-app h2 {
  font-family: 'Architects Daughter', cursive;
  font-weight: 400;
  font-size: 1.3rem;
  margin: 0 0 12px;
  color: var(--ink);
}

.bd-ladowanie {
  padding: 60px 0;
  text-align: center;
  color: var(--ink-muted);
  font-family: 'Architects Daughter', cursive;
  font-size: 1.5rem;
}

/* header */
.bd-header {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 18px 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.05);
}

.bd-okres-przelacznik {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
  background: var(--paper);
  border-radius: 8px;
  padding: 3px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}
.bd-okres-przelacznik button {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--ink-muted);
  cursor: pointer;
}
.bd-okres-przelacznik button.bd-aktywny {
  color: var(--ink);
  background: var(--card);
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.1);
}

.bd-okres-daty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}
.bd-okres-daty input {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.88rem;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  color: var(--ink);
}
.bd-okres-daty input:focus { outline: 2px solid var(--focus); outline-offset: 1px; }
.bd-okres-lacznik { color: var(--ink-muted); font-family: 'Inter', sans-serif; font-weight: 600; }

.bd-miesiac-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}
.bd-miesiac-nav h1 {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 2rem;
  margin: 0;
  min-width: 180px;
  text-align: center;
  line-height: 1.1;
}
.bd-strzalka {
  background: var(--paper);
  border: 1px solid var(--line);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ink);
  flex-shrink: 0;
}
.bd-strzalka:hover { background: var(--line); }

.bd-staty {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 8px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}
.bd-stat { display: flex; flex-direction: column; gap: 2px; text-align: center; }
.bd-stat-bilans { border-left: 1px solid var(--line); border-right: 1px solid var(--line); }
.bd-stat-etykieta { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.66rem; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.bd-stat-liczba { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 1.15rem; line-height: 1.2; font-variant-numeric: tabular-nums; }
.bd-zielony { color: var(--zielony); }
.bd-czerwony { color: var(--czerwony); }

/* form */
.bd-formularz {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.05);
}

.bd-przelacznik {
  display: inline-flex;
  background: var(--paper);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
  margin-bottom: 12px;
}
.bd-przelacznik button {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ink-muted);
  cursor: pointer;
}
.bd-przelacznik button.bd-aktywny { background: var(--ink); color: var(--card); }

.bd-pola {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}
.bd-pole-kwota { font-weight: 700; font-size: 1.05rem; }

.bd-formularz input,
.bd-formularz select {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.92rem;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  color: var(--ink);
  width: 100%;
  font-variant-numeric: tabular-nums;
}
.bd-formularz input:focus,
.bd-formularz select:focus { outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(46, 111, 158, 0.12); }
.bd-formularz input::placeholder { color: var(--ink-muted); opacity: 0.75; }

.bd-nowa-kat-inline {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
  padding: 10px;
  background: var(--paper);
  border-radius: 8px;
  border: 1px dashed var(--line);
}
.bd-nowa-kat-inline input { font-size: 0.88rem; }

.bd-pole-opis { margin-bottom: 12px; }

.bd-przycisk-dodaj {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  background: var(--ink);
  color: var(--card);
  border: none;
  padding: 11px;
  border-radius: 9px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
}
.bd-przycisk-dodaj:hover { background: #0E1730; }

.bd-formularz-edycja { border-color: var(--focus); box-shadow: 0 0 0 3px rgba(46, 111, 158, 0.12); }
.bd-edycja-etykieta {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.74rem; color: var(--focus);
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px;
}
.bd-anuluj-edycje {
  width: 100%; margin-top: 8px; background: transparent; border: 1px solid var(--line);
  color: var(--ink-muted); font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.84rem;
  padding: 9px; border-radius: 9px; cursor: pointer;
}
.bd-anuluj-edycje:hover { background: var(--paper); }

/* zakładki */
.bd-tabnav {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.6);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.bd-tabnav button {
  flex: 0 0 auto;
  background: transparent;
  border: none;
  border-radius: 7px;
  padding: 7px 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--ink-muted);
  cursor: pointer;
  white-space: nowrap;
}
.bd-tabnav button.bd-aktywny {
  color: var(--ink);
  background: var(--card);
  box-shadow: 0 1px 3px rgba(23, 33, 58, 0.1);
}

.bd-zakladki-akcje { display: flex; justify-content: flex-end; margin: -10px 0 14px; }
.bd-zakladki-link { display: inline-flex; align-items: center; gap: 4px; padding-top: 0 !important; }

.bd-edycja-zakladek {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 18px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.05);
}
.bd-edycja-zakladek-wiersz {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.bd-edycja-zakladek-etykieta {
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.78rem; color: var(--ink-muted);
  text-transform: capitalize;
}
.bd-edycja-zakladek input {
  font-family: 'Inter', sans-serif; font-weight: 500; font-size: 0.88rem;
  padding: 6px 9px; border: 1px solid var(--line); border-radius: 7px; background: var(--paper); color: var(--ink);
}
.bd-edycja-zakladek input:focus { outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(46, 111, 158, 0.12); }
.bd-edycja-zakladek .bd-formularz-kategorii-przyciski { margin-top: 10px; }

/* analiza */
.bd-analiza-sekcja { margin-bottom: 24px; }
.bd-analiza-lista { display: flex; flex-direction: column; gap: 10px; }
.bd-analiza-karta {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--ink-muted);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-analiza-karta.bd-analiza-sukces { border-left-color: var(--zielony); }
.bd-analiza-karta.bd-analiza-ostrzezenie { border-left-color: #C98A2B; }
.bd-analiza-karta.bd-analiza-cel { border-left-color: var(--focus); }
.bd-analiza-emoji { font-size: 1.15rem; line-height: 1.4; flex-shrink: 0; }
.bd-analiza-tekst { font-family: 'Inter', sans-serif; font-size: 0.88rem; color: var(--ink); line-height: 1.5; }

/* dane / kopia zapasowa */
.bd-dane-sekcja { margin-bottom: 24px; }
.bd-dane-statystyki { font-family: 'Inter', sans-serif; font-size: 0.82rem; color: var(--ink-muted); margin: 8px 0 16px; }
.bd-dane-przyciski { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.bd-dane-przycisk {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; background: var(--card); color: var(--ink); border: 1px solid var(--line);
  padding: 11px; border-radius: 9px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.9rem;
  cursor: pointer; box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-dane-przycisk:hover { background: var(--paper); }
.bd-dane-info { font-family: 'Inter', sans-serif; font-size: 0.82rem; color: var(--ink-muted); margin: 8px 0 12px; line-height: 1.5; }
.bd-dane-import-etykieta {
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  background: var(--ink); color: var(--card); border-radius: 9px; padding: 10px 16px;
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.88rem;
}
.bd-dane-import-input { display: none; }
.bd-dane-blad { font-family: 'Inter', sans-serif; font-size: 0.82rem; color: var(--czerwony); margin-top: 12px; }
.bd-dane-sukces { font-family: 'Inter', sans-serif; font-size: 0.82rem; color: var(--zielony); margin-top: 12px; }
.bd-dane-potwierdzenie {
  margin-top: 14px;
  background: var(--card);
  border: 1px solid var(--czerwony);
  border-radius: 12px;
  padding: 14px 16px;
}
.bd-dane-potwierdzenie p {
  font-family: 'Inter', sans-serif; font-size: 0.84rem; color: var(--ink); line-height: 1.5; margin: 0 0 10px;
}

/* przegląd / dashboard */
.bd-dashboard { margin-bottom: 24px; }

.bd-dash-hero {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 18px;
  margin-bottom: 14px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.05);
}
.bd-dash-hero-etykieta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.72rem;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.bd-dash-hero-liczba {
  display: block;
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 2.4rem;
  line-height: 1.1;
  color: var(--zielony);
  font-variant-numeric: tabular-nums;
}
.bd-dash-hero-dzien { font-size: 1.05rem; font-weight: 500; color: var(--ink-muted); }
.bd-dash-hero-podpis {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  color: var(--ink-muted);
  margin-top: 6px;
  line-height: 1.5;
}

.bd-dash-siatka {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.bd-dash-karta {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-dash-etykieta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.68rem;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}
.bd-dash-liczba {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 1.35rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.bd-dash-podpis {
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  color: var(--ink-muted);
  line-height: 1.4;
}

/* porównanie miesięcy */
.bd-porownanie-sekcja { margin-bottom: 24px; }
.bd-porownanie-komunikat {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: var(--ink);
  margin: 10px 0 14px;
  line-height: 1.5;
}
.bd-porownanie-tabela { display: flex; flex-direction: column; gap: 5px; }
.bd-porownanie-wiersz {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 0.8fr;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--kat-kolor);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}
.bd-porownanie-wiersz.bd-porownanie-naglowek {
  background: transparent;
  border: none;
  border-left: none;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 600;
  font-size: 0.64rem;
  padding: 0 10px;
}
.bd-porownanie-kategoria { display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.85rem; }
.bd-porownanie-brak { color: var(--ink-muted); }

/* siatka: kategorie / zapisy */
.bd-siatka { display: grid; grid-template-columns: 1fr; gap: 18px; margin-bottom: 24px; }
@media (min-width: 680px) { .bd-siatka { grid-template-columns: 250px 1fr; } }

.bd-sekcja-naglowek { display: flex; align-items: center; gap: 6px; color: var(--ink-muted); margin-bottom: 10px; }
.bd-sekcja-naglowek-druga { margin-top: 20px; }

/* category cards */
.bd-lista-kategorii { display: flex; flex-direction: column; gap: 8px; }
.bd-kategoria-karta {
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--kat-kolor);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-kategoria-gora { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.bd-kategoria-kropka { width: 8px; height: 8px; border-radius: 50%; background: var(--kat-kolor); flex-shrink: 0; }
.bd-kolor-przycisk {
  width: 20px; height: 20px; border-radius: 50%; background: var(--kat-kolor);
  border: 2px solid var(--card); box-shadow: 0 0 0 1.5px var(--line);
  padding: 0; cursor: pointer; flex-shrink: 0;
}
.bd-kolor-przycisk:hover { box-shadow: 0 0 0 2px var(--ink-muted); }
.bd-wybor-koloru {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  padding: 10px 2px 8px; margin-bottom: 4px; border-top: 1px dashed var(--line);
}
.bd-probka-koloru {
  width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--card);
  box-shadow: 0 0 0 1px var(--line); padding: 0; cursor: pointer;
}
.bd-probka-aktywna { box-shadow: 0 0 0 2.5px var(--ink); }
.bd-wlasny-kolor {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.78rem; color: var(--ink-muted);
}
.bd-wlasny-kolor input[type="color"] {
  width: 30px; height: 26px; padding: 0; border: 1px solid var(--line); border-radius: 6px;
  background: var(--card); cursor: pointer;
}
.bd-nowa-kat-kolor { padding: 2px 0; }
.bd-kategoria-nazwa { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.92rem; flex: 1; }
.bd-nazwa-input {
  flex: 1; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.9rem;
  border: 1px solid var(--focus); border-radius: 6px; background: var(--card); color: var(--ink);
  padding: 2px 6px;
}
.bd-nazwa-input:focus { outline: none; }

.bd-pasek-tlo { height: 7px; background: var(--paper); border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }
.bd-pasek-wypelnienie { height: 100%; background: var(--kat-kolor); border-radius: 4px; }
.bd-pasek-wypelnienie.bd-przekroczony { background: var(--czerwony); }

.bd-kategoria-kwoty {
  display: flex; justify-content: space-between; align-items: center;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.76rem; color: var(--ink-muted); margin-top: 6px;
  font-variant-numeric: tabular-nums;
}
.bd-przekroczony-tekst { color: var(--czerwony); font-weight: 700; }
.bd-limit-link {
  background: none; border: none; color: var(--focus); font-weight: 600;
  font-size: 0.76rem; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; padding: 0;
}
.bd-limit-input {
  width: 78px; font-size: 0.76rem; padding: 3px 6px; border: 1px solid var(--focus);
  border-radius: 6px; background: var(--card); font-family: 'Inter', sans-serif; font-weight: 600;
}

.bd-dodaj-kategorie-link, .bd-usun-mikro {
  background: transparent; border: none; cursor: pointer;
}
.bd-dodaj-kategorie-link {
  color: var(--zielony); font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.86rem; padding: 10px 0 0;
}
.bd-usun-mikro {
  color: var(--ink-muted);
  opacity: 0.75;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  min-height: 34px;
  padding: 8px;
  border-radius: 8px;
}
.bd-usun-mikro:hover { opacity: 1; color: var(--czerwony); background: rgba(23, 33, 58, 0.06); }
.bd-usun-mikro:active { background: rgba(23, 33, 58, 0.1); }
.bd-przesun-mikro { min-width: 30px; padding: 6px; }
.bd-usun-mikro:disabled { opacity: 0.2; cursor: default; background: transparent; color: var(--ink-muted); }

.bd-formularz-kategorii {
  display: flex; flex-direction: column; gap: 8px;
  margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--line);
}
.bd-formularz-kategorii input,
.bd-formularz-kategorii select {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.9rem; padding: 7px 9px; border: 1px solid var(--line);
  border-radius: 8px; background: var(--paper); color: var(--ink); width: 100%;
}
.bd-formularz-kategorii input:focus,
.bd-formularz-kategorii select:focus { outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(46, 111, 158, 0.12); }
.bd-formularz-kategorii-przyciski { display: flex; gap: 6px; }
.bd-formularz-kategorii-przyciski button {
  flex: 1; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.88rem; padding: 7px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--card); cursor: pointer;
}
.bd-formularz-kategorii-przyciski button[type="submit"] {
  background: var(--ink); color: var(--card); border-color: var(--ink);
}

/* cele oszczędnościowe */
.bd-cele-sekcja { margin-bottom: 24px; }
.bd-lista-celow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
@media (min-width: 560px) { .bd-lista-celow { grid-template-columns: 1fr 1fr; } }

.bd-cel-karta {
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--kat-kolor);
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-cel-emoji { font-size: 1.15rem; line-height: 1; }
.bd-cel-kwoty-glowne { margin: 4px 0 8px; }
.bd-cel-odlozone { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 1.3rem; color: var(--ink); font-variant-numeric: tabular-nums; }
.bd-cel-docelowe { font-family: 'Inter', sans-serif; font-size: 0.84rem; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
.bd-cel-procent {
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.72rem; color: var(--ink-muted);
  text-align: right; margin-top: 4px;
}
.bd-cel-info {
  font-family: 'Inter', sans-serif; font-size: 0.8rem; color: var(--ink-muted);
  margin: 8px 0 8px; line-height: 1.5;
}
.bd-cel-info.bd-cel-sukces { color: var(--zielony); font-weight: 600; }

.bd-cel-wplata-form { display: flex; gap: 6px; align-items: center; }
.bd-cel-wplata-form input {
  flex: 1; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 0.88rem;
  padding: 6px 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--paper);
}
.bd-cel-wplata-form input:focus { outline: none; border-color: var(--focus); }
.bd-cel-wplata-form button {
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.84rem; padding: 6px 12px;
  border-radius: 7px; border: 1px solid var(--line); background: var(--card); cursor: pointer;
}
.bd-cel-wplata-form button:first-of-type { background: var(--zielony); color: var(--card); border-color: var(--zielony); }

.bd-formularz-celu-rzad { display: grid; grid-template-columns: 1fr 2fr; gap: 6px; }
.bd-cel-emoji-input { text-align: center; }

/* transakcje cykliczne */
.bd-cykliczne-sekcja { margin-bottom: 24px; }

.bd-lista-nadchodzacych { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.bd-nadchodzacy-wiersz {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--kat-kolor);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-nadchodzacy-info { display: flex; flex-direction: column; gap: 1px; }
.bd-nadchodzacy-etykieta {
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.68rem; color: var(--focus);
  text-transform: uppercase; letter-spacing: 0.04em;
}
.bd-nadchodzacy-nazwa { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.94rem; }

.bd-lista-cyklicznych { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.bd-cykl-karta {
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--kat-kolor);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-cykl-szczegoly { display: flex; align-items: center; gap: 10px; font-family: 'Inter', sans-serif; font-size: 0.8rem; }
.bd-cykl-szczegoly .bd-zielony, .bd-cykl-szczegoly .bd-czerwony { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 1rem; font-variant-numeric: tabular-nums; }
.bd-cykl-opis-tekst { color: var(--ink-muted); }

/* transactions list */
.bd-pusto { color: var(--ink-muted); font-family: 'Inter', sans-serif; font-size: 0.9rem; }
.bd-grupa-dnia { margin-bottom: 12px; }
.bd-data-naglowek { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.7rem; color: var(--ink-muted); text-transform: capitalize; margin-bottom: 5px; letter-spacing: 0.03em; }

.bd-wiersz {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--kat-kolor);
  border-radius: 10px;
  margin-bottom: 6px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-wiersz-opis { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
.bd-wiersz-kategoria { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.92rem; }
.bd-wiersz-notatka { font-family: 'Inter', sans-serif; font-size: 0.76rem; color: var(--ink-muted); }
.bd-wiersz-kwota { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 1.02rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
.bd-wiersz-kwota.bd-dodatnia { color: var(--zielony); }
.bd-wiersz-kwota.bd-ujemna { color: var(--ink); }

/* podsumowanie roczne */
.bd-rok-sekcja { margin-bottom: 24px; }
.bd-rok-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 18px;
}
.bd-rok-tytul {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 2rem;
  margin: 0;
  min-width: 90px;
  text-align: center;
}
.bd-rok-siatka { margin-bottom: 20px; }

.bd-rok-wykres { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.bd-rok-miesiac-wiersz { display: grid; grid-template-columns: 34px 1fr; align-items: center; gap: 10px; }
.bd-rok-miesiac-etykieta {
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.74rem;
  color: var(--ink-muted); text-transform: uppercase;
}
.bd-rok-paski { display: flex; flex-direction: column; gap: 3px; }
.bd-rok-pasek-tlo { height: 6px; background: var(--card); border: 1px solid var(--line); border-radius: 3px; overflow: hidden; }
.bd-rok-pasek { height: 100%; border-radius: 3px; }
.bd-rok-pasek-wplyw { background: var(--zielony); }
.bd-rok-pasek-wydatek { background: var(--czerwony); }

.bd-rok-ranking { display: flex; flex-direction: column; gap: 6px; }
.bd-rok-ranking-wiersz {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 4px solid var(--kat-kolor);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(23, 33, 58, 0.04);
}
.bd-rok-medal { font-size: 1.05rem; font-family: 'Inter', sans-serif; font-weight: 700; color: var(--ink-muted); min-width: 22px; }
.bd-rok-ranking-nazwa { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.92rem; }
.bd-rok-ranking-kwota { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.94rem; font-variant-numeric: tabular-nums; }

/* breakdown */
.bd-wykres { display: flex; flex-direction: column; gap: 10px; }
.bd-wykres-wiersz { display: grid; grid-template-columns: 90px 1fr auto; align-items: center; gap: 10px; }
.bd-wykres-etykieta { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.84rem; color: var(--ink-muted); }
.bd-wykres-pasek-tlo { height: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.bd-wykres-pasek { height: 100%; border-radius: 6px; }
.bd-wykres-kwota { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.78rem; white-space: nowrap; font-variant-numeric: tabular-nums; }

@media (max-width: 400px) {
  .bd-pola { grid-template-columns: 1fr; }
  .bd-nowa-kat-inline { grid-template-columns: 1fr; }
  .bd-staty { grid-template-columns: 1fr 1fr; }
  .bd-okres-daty { gap: 4px; }
  .bd-okres-daty input { font-size: 0.82rem; padding: 6px 4px; }
  .bd-dash-hero-liczba { font-size: 2rem; }
  .bd-stat-bilans { grid-column: span 2; border-left: none; border-right: none; border-top: 1px solid var(--line); padding-top: 8px; }
  .bd-app { padding-left: 32px; }
}
`;
