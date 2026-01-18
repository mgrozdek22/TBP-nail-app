require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- DB --------------------
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

app.get("/health", (req, res) => res.json({ ok: true }));

// ===================================================================
// AUTH (view_korisnici_auth)
// ===================================================================
app.post("/login", async (req, res) => {
  try {
    const { korisnicko_ime } = req.body;
    if (!korisnicko_ime) {
      return res.status(400).json({ ok: false, error: "Nedostaje korisnicko_ime" });
    }

    const r = await pool.query(
      "SELECT * FROM view_korisnici_auth WHERE korisnicko_ime = $1",
      [korisnicko_ime]
    );

    if (r.rows.length === 0) {
      return res.status(401).json({ ok: false, error: "Korisnik ne postoji" });
    }

    res.json({ ok: true, user: r.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ===================================================================
// MODERACIJA (view_moderacija_pending + procedura moderiraj_stavku)
// ===================================================================
app.get("/moderacija/pending", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM view_moderacija_pending ORDER BY datum_unosa DESC"
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/moderacija/akcija", async (req, res) => {
  try {
    const { tip, id, akcija, moderator_id } = req.body;

    if (!tip || id === undefined || !akcija || !moderator_id) {
      return res.status(400).json({ error: "Nedostaje tip/id/akcija/moderator_id" });
    }

    await pool.query("CALL moderiraj_stavku($1, $2, $3, $4)", [
      tip,
      BigInt(id),
      akcija,
      toInt(moderator_id),
    ]);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/mapa/tehnicarke", async (req, res) => {
  try {
    const { tehnika_id, oblik_id, samo_dostupne, logika } = req.query;

    const logikaVal = (logika || "AND").toUpperCase() === "OR" ? "OR" : "AND";

    const r = await pool.query(
      "SELECT dohvati_tehnicarke_mapa($1, $2, $3, $4) AS podaci",
      [
        tehnika_id ? Number(tehnika_id) : null,
        oblik_id ? Number(oblik_id) : null,
        samo_dostupne === "1",
        logikaVal,
      ]
    );

    res.json(r.rows[0].podaci);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ===================================================================
// PREPORUKE (generiraj_preporuke)
// ===================================================================
app.get("/preporuke/:korisnik_id", async (req, res) => {
  try {
    const korisnik_id = toInt(req.params.korisnik_id);
    const r = await pool.query("SELECT * FROM generiraj_preporuke($1)", [korisnik_id]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// LISTE (view_aktivne_*)
// ===================================================================
app.get("/tehnike", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM view_aktivne_tehnike ORDER BY naziv");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/oblici", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM view_aktivni_oblici ORDER BY naziv");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tehnicarke-list", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM view_aktivne_tehnicarke ORDER BY naziv");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// alias za nova_lokacija.html
app.get("/tehnicarke", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM view_aktivne_tehnicarke ORDER BY naziv");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tehnicarke-bez-odobrene-lokacije", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM view_tehnicarke_bez_odobrene_lokacije"
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ===================================================================
// TEHNICARKA - DETALJI (view_detalji_tehnicarke)
// ===================================================================
app.get("/tehnicarke/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const r = await pool.query(
      "SELECT * FROM view_detalji_tehnicarke WHERE tehnicarka_id = $1",
      [id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "Nije pronađena" });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// RECENZIJE (view_recenzije_prosirano)
// ===================================================================
app.get("/tehnicarke/:id/recenzije", async (req, res) => {
  try {
    const id = toInt(req.params.id);
    const korisnik_id = toInt(req.query.korisnik_id);

    if (!korisnik_id) {
      return res.status(400).json({ error: "Nedostaje korisnik_id" });
    }

    const r = await pool.query(
      "SELECT * FROM dohvati_recenzije_tehnicarke($1,$2)",
      [id, korisnik_id]
    );

    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/tehnicarke", async (req, res) => {
  try {
    const { naziv, uneseno_od } = req.body;

    if (!naziv || !uneseno_od) {
      return res.status(400).json({ ok: false, error: "Nedostaje naziv ili uneseno_od." });
    }

    const r = await pool.query("SELECT dodaj_tehnicarku($1, $2) AS id", [
      naziv.trim(),
      toInt(uneseno_od),
    ]);

    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    if (err.code === "23505" && err.constraint === "uq_tehnicarka_naziv_aktivni") {
      return res.status(409).json({
        ok: false,
        error: "Tehničarka s tim nazivom već postoji (odobrena ili u provjeri).",
      });
    }

    res.status(500).json({ ok: false, error: "Greška na serveru: " + err.message });
  }
});

app.post("/tehnike", async (req, res) => {
  try {
    const { naziv, uneseno_od } = req.body;
    const r = await pool.query("SELECT dodaj_tehniku($1, $2) AS id", [
      naziv,
      toInt(uneseno_od),
    ]);
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {

    if (err.code === "23505" && err.constraint === "uq_tehnika_naziv_aktivni") {
      return res.status(409).json({
        ok: false,
        error: "Tehnika s tim nazivom već postoji (odobrena ili u provjeri).",
      });
    }

    res.status(500).json({ error: err.message });
  }
});

app.post("/oblici", async (req, res) => {
  try {
    const { naziv, uneseno_od } = req.body;
    const r = await pool.query("SELECT dodaj_oblik($1, $2) AS id", [
      naziv,
      toInt(uneseno_od),
    ]);
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {

    if (err.code === "23505" && err.constraint === "uq_oblik_naziv_aktivni") {
      return res.status(409).json({
        ok: false,
        error: "Oblik s tim nazivom već postoji (odobren ili u provjeri).",
      });
    }
    res.status(500).json({ error: err.message });
  }
});


app.post("/lokacije", async (req, res) => {
  try {
    const { tehnicarka_id, naziv_lokacije, lat, lon, od, do: doV, uneseno_od } = req.body;

    if (!tehnicarka_id || !naziv_lokacije || lat === undefined || lon === undefined || !od || !doV || !uneseno_od) {
      return res.status(400).json({ ok: false, error: "Nedostaju obavezna polja." });
    }

    const odDate = new Date(od);
    const doDate = new Date(doV);

    if (Number.isNaN(odDate.getTime()) || Number.isNaN(doDate.getTime())) {
      return res.status(400).json({
        ok: false,
        error: "Neispravan datum. Provjeri format (npr. 2026-01-17T10:30).",
      });
    }

    if (odDate >= doDate) {
      return res.status(400).json({
        ok: false,
        error: "Datum 'OD' mora biti prije datuma 'DO'.",
      });
    }

    const r = await pool.query(
      "SELECT dodaj_lokaciju($1,$2,$3,$4,$5,$6,$7) AS id",
      [
        toInt(tehnicarka_id),
        naziv_lokacije.trim(),
        Number(lat),
        Number(lon),
        od,
        doV,
        toInt(uneseno_od),
      ]
    );

    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {

    if (
      err.message?.includes("range lower bound") ||
      err.constraint === "chk_razdoblje_lokacija"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Razdoblje nije valjano: datum 'OD' mora biti prije datuma 'DO'.",
      });
    }

    if (err.code === "23P01" && err.constraint === "no_overlap_lokacija") {
      return res.status(409).json({
        ok: false,
        error: "Ta tehničarka već ima lokaciju (odobrenu ili u provjeri) u tom vremenskom razdoblju.",
      });
    }

    res.status(500).json({ ok: false, error: "Greška na serveru: " + err.message });
  }
});


app.get("/tehnicarke/:id/tehnike", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const r = await pool.query(
      `SELECT tehnika_id, naziv, status
       FROM view_tehnicarka_tehnike
       WHERE tehnicarka_id = $1
       ORDER BY naziv ASC`,
      [tehnicarka_id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tehnicarke/:id/tehnike", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const { tehnika_id, uneseno_od } = req.body;

    if (!tehnika_id || !uneseno_od) {
      return res.status(400).json({ error: "Nedostaje tehnika_id ili uneseno_od" });
    }

    const r = await pool.query(
      "SELECT dodaj_tehnicarka_tehnika($1,$2,$3) AS ok",
      [tehnicarka_id, toInt(tehnika_id), toInt(uneseno_od)]
    );

    res.json({ ok: true, inserted: r.rows[0].ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tehnicarke/:id/profil-prijedlog", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const { autor_id, patch } = req.body;

    if (!autor_id || !patch) {
      return res.status(400).json({ ok: false, error: "Nedostaje autor_id ili patch" });
    }

    const r = await pool.query(
      "SELECT dodaj_prijedlog_profila($1,$2,$3) AS id",
      [tehnicarka_id, toInt(autor_id), patch]
    );

    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


// ===================================================================
// TEHNICARKA PROFIL: OBLICI (view + funkcija)
// ===================================================================
app.get("/tehnicarke/:id/oblici", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const r = await pool.query(
      `SELECT oblik_id, naziv, status
       FROM view_tehnicarka_oblici
       WHERE tehnicarka_id = $1
       ORDER BY naziv ASC`,
      [tehnicarka_id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tehnicarke/:id/oblici", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const { oblik_id, uneseno_od } = req.body;

    if (!oblik_id || !uneseno_od) {
      return res.status(400).json({ error: "Nedostaje oblik_id ili uneseno_od" });
    }

    const r = await pool.query(
      "SELECT dodaj_tehnicarka_oblik($1,$2,$3) AS ok",
      [tehnicarka_id, toInt(oblik_id), toInt(uneseno_od)]
    );

    res.json({ ok: true, inserted: r.rows[0].ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// TEHNICARKA PROFIL: LOKACIJE (view)
// ===================================================================
app.get("/tehnicarke/:id/lokacije", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const r = await pool.query(
      `SELECT tehnicarka_lokacija_id, naziv_lokacije, lat, lon, od, "do", status
       FROM view_tehnicarka_lokacije
       WHERE tehnicarka_id = $1
       ORDER BY od DESC`,
      [tehnicarka_id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================================================
// TEHNICARKA PROFIL: DOSTUPNOSTI (view + funkcija)
// ===================================================================
app.get("/tehnicarke/:id/dostupnosti", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const r = await pool.query(
      `SELECT dostupnost_id, radi, od, "do", napomena, status
       FROM view_dostupnosti_tehnicarke
       WHERE tehnicarka_id = $1
       ORDER BY od DESC`,
      [tehnicarka_id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tehnicarke/:id/dostupnosti", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const { radi, od, do: doV, napomena, uneseno_od } = req.body;

    if (typeof radi !== "boolean" || !od || !doV || !uneseno_od) {
      return res.status(400).json({ error: "Nedostaje radi/od/do/uneseno_od" });
    }

    // ✅ LJEPŠA PORUKA - provjera datuma (kao za lokaciju)
    const odDate = new Date(od);
    const doDate = new Date(doV);

    if (Number.isNaN(odDate.getTime()) || Number.isNaN(doDate.getTime())) {
      return res.status(400).json({
        ok: false,
        error: "Neispravan datum. Provjeri format (npr. 2026-01-17T10:30).",
      });
    }

    if (odDate >= doDate) {
      return res.status(400).json({
        ok: false,
        error: "Datum 'OD' mora biti prije datuma 'DO'.",
      });
    }

    const r = await pool.query(
      "SELECT dodaj_dostupnost_tehnicarke($1,$2,$3,$4,$5,$6) AS id",
      [tehnicarka_id, radi, od, doV, napomena || null, toInt(uneseno_od)]
    );

    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    // ✅ ako ipak dođe do range greške iz baze
    if (
      err.message?.includes("range lower bound") ||
      err.constraint === "chk_razdoblje_dostupnost"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Datum 'OD' mora biti prije datuma 'DO'.",
      });
    }

if (err.code === "23P01" && err.constraint === "no_overlap_dostupnost") {
  return res.status(409).json({
    ok: false,
    error: "Ta tehničarka već ima unesenu dostupnost (odobrenu ili u provjeri) u tom vremenskom razdoblju.",
  });
}

    res.status(500).json({ error: err.message });
  }
});


// ===================================================================
// RECENZIJE (funkcija) + GLASANJE (funkcija)
// ===================================================================
app.post("/tehnicarke/:id/recenzije", async (req, res) => {
  try {
    const tehnicarka_id = toInt(req.params.id);
    const {
      autor_id,
      tehnika_id,
      oblik_id,
      ocjena_tehnicarke,
      ocjena_tehnike,
      ocjena_oblika,
      tekst,
    } = req.body;

    if (!autor_id || !tehnika_id || !oblik_id) {
      return res.status(400).json({ error: "Nedostaje autor_id/tehnika_id/oblik_id" });
    }

    const r = await pool.query(
      "SELECT dodaj_recenziju($1,$2,$3,$4,$5,$6,$7,$8) AS id",
      [
        tehnicarka_id,
        toInt(autor_id),
        toInt(tehnika_id),
        toInt(oblik_id),
        toInt(ocjena_tehnicarke),
        toInt(ocjena_tehnike),
        toInt(ocjena_oblika),
        tekst || null,
      ]
    );

    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {

    if (err.code === "23505") {
  return res.status(409).json({
    ok: false,
    error: "Već si ostavila recenziju za ovu tehničarku s istom kombinacijom tehnike i oblika.",
  });
}

    res.status(500).json({ error: err.message });
  }
});

app.post("/recenzije/:recenzija_id/glas", async (req, res) => {
  try {
    const recenzija_id = toInt(req.params.recenzija_id);
    const { glasao_id, korisno } = req.body;

    if (!glasao_id || typeof korisno !== "boolean") {
      return res.status(400).json({ error: "Nedostaje glasao_id ili korisno (true/false)" });
    }

    await pool.query("SELECT dodaj_glas_recenzije($1,$2,$3)", [
      recenzija_id,
      toInt(glasao_id),
      korisno,
    ]);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Server je uspješno pokrenut! Koristite API rute poput /tehnike ili /oblici.");
});

// ===================================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server pokrenut na portu ${PORT}`));
