import React, { useMemo, useState, useEffect } from "react";

/**
 * Spanish Verb Trainer (no-backend starter)
 * -----------------------------------------------------------
 * What it does
 * - Practice Spanish verb conjugations with an editable verb bank
 * - Tracks progress per student (in-browser)
 * - Lets you export/import verbs and export progress (CSV) for teacher
 *
 * What it does NOT do (yet)
 * - True multi-device syncing or logins (no server)
 * - Perfect irregular coverage (adapter supports custom forms)
 *
 * How to use (teacher)
 * 1) Open Settings → Manage Verbs to add/edit verbs or bulk import (CSV/JSON)
 * 2) Share the app URL with students. Ask them to enter their name + class code
 * 3) Students practice; results are stored locally and can be exported as CSV
 * 4) They can upload the CSV to your assignment dropbox / email / Teams
 *
 * How to use (student)
 * 1) Enter your name (and optional class code) in the login panel
 * 2) Choose tenses/persons → Start Practice
 * 3) Type answers, press Enter → immediate feedback
 * 4) See your stats; Export CSV to share with your teacher
 *
 * Notes on conjugation
 * - Regular -ar/-er/-ir patterns supported for common tenses
 * - For irregulars, add custom forms in the verb editor (per tense/person)
 *
 * Roadmap ideas (easy to add later)
 * - Google Form submit: paste a formResponse URL + entry IDs in Settings
 * - Cloud sync via Firebase/Supabase
 * - More tenses/moods; accent helper keyboard
 */

// ---------------------- Types ----------------------
const PERSONS = [
  { key: "yo", label: "yo" },
  { key: "tú", label: "tú" },
  { key: "él/ella/usted", label: "él/ella/usted" },
  { key: "nosotros", label: "nosotros" },
  { key: "vosotros", label: "vosotros" },
  { key: "ellos/ellas/ustedes", label: "ellos/ellas/ustedes" },
];

const TENSES = [
  { key: "presente", label: "Presente" },
  { key: "preterito", label: "Pretérito" },
  { key: "imperfecto", label: "Imperfecto" },
  { key: "futuro", label: "Futuro" },
  { key: "condicional", label: "Condicional" },
];

// ----------------- Starter Verb Bank -----------------
const STARTER_VERBS = [
  { infinitive: "hablar", meaning: "to speak", type: "-ar", tags: ["regular"], custom: {} },
  { infinitive: "comer", meaning: "to eat", type: "-er", tags: ["regular"], custom: {} },
  { infinitive: "vivir", meaning: "to live", type: "-ir", tags: ["regular"], custom: {} },
  {
    infinitive: "ser",
    meaning: "to be",
    type: "irregular",
    tags: ["irregular", "core"],
    custom: {
      presente: {
        "yo": "soy",
        "tú": "eres",
        "él/ella/usted": "es",
        "nosotros": "somos",
        "vosotros": "sois",
        "ellos/ellas/ustedes": "son",
      },
      preterito: {
        "yo": "fui",
        "tú": "fuiste",
        "él/ella/usted": "fue",
        "nosotros": "fuimos",
        "vosotros": "fuisteis",
        "ellos/ellas/ustedes": "fueron",
      },
      imperfecto: {
        "yo": "era",
        "tú": "eras",
        "él/ella/usted": "era",
        "nosotros": "éramos",
        "vosotros": "erais",
        "ellos/ellas/ustedes": "eran",
      },
    },
  },
  {
    infinitive: "ir",
    meaning: "to go",
    type: "irregular",
    tags: ["irregular", "core"],
    custom: {
      presente: {
        "yo": "voy",
        "tú": "vas",
        "él/ella/usted": "va",
        "nosotros": "vamos",
        "vosotros": "vais",
        "ellos/ellas/ustedes": "van",
      },
      preterito: {
        "yo": "fui",
        "tú": "fuiste",
        "él/ella/usted": "fue",
        "nosotros": "fuimos",
        "vosotros": "fuisteis",
        "ellos/ellas/ustedes": "fueron",
      },
      imperfecto: {
        "yo": "iba",
        "tú": "ibas",
        "él/ella/usted": "iba",
        "nosotros": "íbamos",
        "vosotros": "ibais",
        "ellos/ellas/ustedes": "iban",
      },
    },
  },
];

// ---------------- Conjugation Engine (basic) ----------------
const endings = {
  presente: {
    "-ar": ["o", "as", "a", "amos", "áis", "an"],
    "-er": ["o", "es", "e", "emos", "éis", "en"],
    "-ir": ["o", "es", "e", "imos", "ís", "en"],
  },
  preterito: {
    "-ar": ["é", "aste", "ó", "amos", "asteis", "aron"],
    "-er": ["í", "iste", "ió", "imos", "isteis", "ieron"],
    "-ir": ["í", "iste", "ió", "imos", "isteis", "ieron"],
  },
  imperfecto: {
    "-ar": ["aba", "abas", "aba", "ábamos", "abais", "aban"],
    "-er": ["ía", "ías", "ía", "íamos", "íais", "ían"],
    "-ir": ["ía", "ías", "ía", "íamos", "íais", "ían"],
  },
  futuro: {
    all: ["é", "ás", "á", "emos", "éis", "án"], // add to infinitive
  },
  condicional: {
    all: ["ía", "ías", "ía", "íamos", "íais", "ían"], // add to infinitive
  },
};

function regularConjugate(infinitive, type, tense, personKey) {
  const personIndex = PERSONS.findIndex((p) => p.key === personKey);
  if (personIndex === -1) return "";

  if (tense === "futuro" || tense === "condicional") {
    const stem = infinitive; // add endings to infinitive
    const list = endings[tense].all;
    return stem + list[personIndex];
  }

  const stem = infinitive.replace(/(ar|er|ir)$/i, "");
  const list = endings[tense]?.[type];
  if (!list) return "";
  return stem + list[personIndex];
}

function conjugate(verb, tense, personKey) {
  // custom irregular override
  const customForm = verb?.custom?.[tense]?.[personKey];
  if (customForm) return customForm;

  if (verb.type === "-ar" || verb.type === "-er" || verb.type === "-ir") {
    return regularConjugate(verb.infinitive, verb.type, tense, personKey);
  }
  // fallback: if irregular without custom, return empty (forces you to add forms)
  return "";
}

// ---------------- Local Storage Helpers ----------------
const LS_KEYS = {
  verbs: "svt_verbs_v1",
  students: "svt_students_v1",
  sessions: "svt_sessions_v1",
  activeStudent: "svt_active_student_v1",
};

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------- CSV utils ----------------
function toCSV(rows, headers) {
  const escape = (s) => '"' + String(s ?? "").replace(/"/g, '""') + '"';
  const head = headers.map(escape).join(",");
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");
  return head + "\n" + body;
}

// ---------------- Main App ----------------
export default function App() {
  const [verbs, setVerbs] = useState(() => loadLS(LS_KEYS.verbs, STARTER_VERBS));
  const [students, setStudents] = useState(() => loadLS(LS_KEYS.students, []));
  const [sessions, setSessions] = useState(() => loadLS(LS_KEYS.sessions, []));
  const [activeStudent, setActiveStudent] = useState(() => loadLS(LS_KEYS.activeStudent, null));

  useEffect(() => saveLS(LS_KEYS.verbs, verbs), [verbs]);
  useEffect(() => saveLS(LS_KEYS.students, students), [students]);
  useEffect(() => saveLS(LS_KEYS.sessions, sessions), [sessions]);
  useEffect(() => saveLS(LS_KEYS.activeStudent, activeStudent), [activeStudent]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Header />
        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-2 space-y-6">
            <LoginPanel {...{ students, setStudents, activeStudent, setActiveStudent }} />
            <PracticePanel {...{ verbs, activeStudent, sessions, setSessions }} />
          </div>
          <div className="space-y-6">
            <StatsPanel {...{ sessions, activeStudent }} />
            <TeacherDashboard {...{ sessions, students }} />
            <SettingsPanel {...{ verbs, setVerbs, sessions }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl md:text-3xl font-bold">Spanish Verb Trainer</h1>
      <div className="text-sm opacity-70">No-backend starter · editable verbs · basic tracking</div>
    </div>
  );
}

// ---------------- Login ----------------
function LoginPanel({ students, setStudents, activeStudent, setActiveStudent }) {
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");

  const addOrSelect = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    let st = students.find((s) => s.name.toLowerCase() === trimmed.toLowerCase() && s.classCode === classCode);
    if (!st) {
      st = { id: crypto.randomUUID(), name: trimmed, classCode };
      setStudents([...students, st]);
    }
    setActiveStudent(st);
    setName("");
  };

  return (
    <section className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Student login</h2>
      {activeStudent ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{activeStudent.name}</div>
            <div className="text-sm text-slate-500">Class: {activeStudent.classCode || "—"}</div>
          </div>
          <button className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={() => setActiveStudent(null)}>Switch</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border rounded-xl px-3 py-2" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Class code (optional)" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
          <button className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={addOrSelect}>Enter</button>
        </div>
      )}
    </section>
  );
}

// ---------------- Practice ----------------
function PracticePanel({ verbs, activeStudent, sessions, setSessions }) {
  const [selectedTenses, setSelectedTenses] = useState(["presente", "preterito"]);
  const [selectedPersons, setSelectedPersons] = useState(PERSONS.map((p) => p.key));
  const [filterTags, setFilterTags] = useState([]);

  const availableTags = useMemo(() => {
    const set = new Set();
    verbs.forEach((v) => v.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [verbs]);

  const [current, setCurrent] = useState(null); // {verb, tense, person}
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // {correct:boolean, expected:string}

  function pickNext() {
    const pool = verbs.filter((v) => (filterTags.length === 0 || v.tags?.some((t) => filterTags.includes(t))));
    if (pool.length === 0) return;
    const tense = randomChoice(selectedTenses);
    const person = randomChoice(selectedPersons);
    const verb = randomChoice(pool);
    setCurrent({ verb, tense, person });
    setAnswer("");
    setFeedback(null);
  }

  useEffect(() => { if (!current) pickNext(); }, [verbs]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!activeStudent || !current) return;
    const expected = conjugate(current.verb, current.tense, current.person);
    const normalized = normalize(answer);
    const correct = normalize(expected) === normalized;

    setFeedback({ correct, expected });

    const record = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      classCode: activeStudent.classCode || "",
      infinitive: current.verb.infinitive,
      meaning: current.verb.meaning,
      tense: current.tense,
      person: current.person,
      expected,
      response: answer,
      correct,
    };
    setSessions([record, ...sessions]);
  };

  const onNext = () => pickNext();

  return (
    <section className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-semibold mb-3">Practice</h2>
      {!activeStudent && (
        <div className="text-sm text-red-600 mb-3">Please enter your name in the login panel first.</div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <MultiSelect label="Tenses" all={TENSES} selected={selectedTenses} setSelected={setSelectedTenses} />
        <MultiSelect label="Persons" all={PERSONS} selected={selectedPersons} setSelected={setSelectedPersons} />
        <TagSelect label="Filter by tags" all={availableTags} selected={filterTags} setSelected={setFilterTags} />
      </div>

      {current && (
        <div className="border rounded-2xl p-4 bg-slate-50">
          <div className="text-sm uppercase tracking-wide text-slate-500">Conjugate</div>
          <div className="text-2xl font-bold mt-1">{current.verb.infinitive} <span className="font-normal text-slate-500">({current.verb.meaning})</span></div>
          <div className="mt-1 text-slate-700">Tense: <b>{labelOf(TENSES, current.tense)}</b> · Person: <b>{current.person}</b></div>

          <form onSubmit={onSubmit} className="mt-4 flex gap-3">
            <input className="flex-1 border rounded-xl px-3 py-2" placeholder="Type the form here" value={answer} onChange={(e) => setAnswer(e.target.value)} autoFocus />
            <button type="submit" className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700">Check</button>
            <button type="button" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={onNext}>Skip</button>
          </form>

          {feedback && (
            <div className={`mt-3 p-3 rounded-xl ${feedback.correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {feedback.correct ? "Correct!" : (
                <div>
                  Incorrect. Expected: <b>{feedback.expected || "(add custom form in verb editor)"}</b>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------- Stats ----------------
function StatsPanel({ sessions, activeStudent }) {
  const mine = useMemo(() => activeStudent ? sessions.filter((s) => s.studentId === activeStudent.id) : [], [sessions, activeStudent]);
  const total = mine.length;
  const correct = mine.filter((s) => s.correct).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;

  // last 20 breakdown by tense
  const byTense = useMemo(() => {
    const recent = mine.slice(0, 50);
    const map = {};
    recent.forEach((r) => {
      map[r.tense] = map[r.tense] || { total: 0, correct: 0 };
      map[r.tense].total += 1;
      if (r.correct) map[r.tense].correct += 1;
    });
    return map;
  }, [mine]);

  const exportCSV = () => {
    const headers = ["ts","studentName","classCode","infinitive","meaning","tense","person","expected","response","correct"];
    const rows = mine.map((r) => ({ ...r, ts: new Date(r.ts).toISOString() }));
    const csv = toCSV(rows, headers);
    downloadFile(`verb-trainer-${activeStudent?.name || "student"}-results.csv`, csv, "text/csv");
  };

  return (
    <section className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Your stats</h2>
      <div className="text-slate-700">Answers: <b>{total}</b> · Correct: <b>{correct}</b> · Accuracy: <b>{pct}%</b></div>

      <div className="mt-3 text-sm">
        <div className="font-medium mb-1">Recent by tense (last 50):</div>
        <ul className="list-disc pl-6">
          {Object.keys(byTense).length === 0 && <li>No data yet.</li>}
          {Object.entries(byTense).map(([tense, v]) => (
            <li key={tense}>{labelOf(TENSES, tense)}: {v.correct}/{v.total}</li>
          ))}
        </ul>
      </div>

      <button className="mt-3 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={exportCSV}>Export my results (CSV)</button>
    </section>
  );
}

// ---------------- Teacher Dashboard ----------------
function TeacherDashboard({ sessions, students }) {
  // Aggregate by student (in this browser)
  const byStudent = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = s.studentId;
      if (!map[key]) map[key] = { name: s.studentName, classCode: s.classCode, total: 0, correct: 0 };
      map[key].total += 1;
      if (s.correct) map[key].correct += 1;
    });
    return map;
  }, [sessions]);

  const rows = Object.entries(byStudent).map(([id, v]) => ({ id, ...v, accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0 }));

  const exportAllCSV = () => {
    const headers = ["studentName","classCode","total","correct","accuracy"];
    const csv = toCSV(rows, headers);
    downloadFile("verb-trainer-class-summary.csv", csv, "text/csv");
  };

  return (
    <section className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Teacher dashboard (this device)</h2>
      <div className="text-sm text-slate-600">Shows results stored in this browser. For remote classes, ask students to export their CSV and send it to you.</div>

      <div className="mt-3 border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Student</th>
              <th className="text-left p-2">Class</th>
              <th className="text-left p-2">Answers</th>
              <th className="text-left p-2">Correct</th>
              <th className="text-left p-2">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="p-2" colSpan={5}>No data yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.classCode || "—"}</td>
                <td className="p-2">{r.total}</td>
                <td className="p-2">{r.correct}</td>
                <td className="p-2">{r.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="mt-3 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={exportAllCSV}>Export class summary (CSV)</button>
    </section>
  );
}

// ---------------- Settings / Verb Manager ----------------
function SettingsPanel({ verbs, setVerbs, sessions }) {
  const [showManager, setShowManager] = useState(false);
  const [raw, setRaw] = useState("");

  const exportVerbs = () => {
    const json = JSON.stringify(verbs, null, 2);
    downloadFile("verb-trainer-verbs.json", json, "application/json");
  };
  const exportSessions = () => {
    const headers = ["ts","studentName","classCode","infinitive","meaning","tense","person","expected","response","correct"];
    const rows = sessions.map((r) => ({ ...r, ts: new Date(r.ts).toISOString() }));
    const csv = toCSV(rows, headers);
    downloadFile("verb-trainer-all-sessions.csv", csv, "text/csv");
  };

  return (
    <section className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Settings & data</h2>
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={() => setShowManager((s) => !s)}>{showManager ? "Close verb manager" : "Manage verbs"}</button>
        <button className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={exportVerbs}>Export verbs (JSON)</button>
        <button className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={exportSessions}>Export all attempts (CSV)</button>
      </div>

      {showManager && (
        <div className="mt-4">
          <VerbManager verbs={verbs} setVerbs={setVerbs} />
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold mb-2">Bulk import</h3>
            <p className="text-sm text-slate-600 mb-2">Paste JSON (array of verbs) or CSV with columns: infinitive,meaning,type,tags (semicolon-separated).</p>
            <textarea className="w-full h-40 border rounded-xl p-2" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Paste verbs JSON or CSV here..." />
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => importVerbs(raw, setVerbs)}>Import</button>
              <button className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={() => setRaw("")}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function VerbManager({ verbs, setVerbs }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // index

  const filtered = verbs.filter((v) => v.infinitive.includes(query) || v.meaning?.includes(query));

  const addBlank = () => {
    setVerbs([{ infinitive: "", meaning: "", type: "-ar", tags: [], custom: {} }, ...verbs]);
    setEditing(0);
  };

  const updateAt = (i, patch) => {
    setVerbs(verbs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };

  const removeAt = (i) => {
    setVerbs(verbs.filter((_, idx) => idx !== i));
  };

  return (
    <div className="border rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <input className="border rounded-xl px-3 py-2" placeholder="Search verbs" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={addBlank}>Add verb</button>
      </div>

      <div className="max-h-80 overflow-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="text-left p-2">Infinitive</th>
              <th className="text-left p-2">Meaning</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Tags</th>
              <th className="text-left p-2">Irregular forms (by tense/person)</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={i} className="border-t align-top">
                <td className="p-2 min-w-[120px]"><input className="border rounded px-2 py-1 w-full" value={v.infinitive} onChange={(e) => updateAt(i, { infinitive: e.target.value })} /></td>
                <td className="p-2 min-w-[160px]"><input className="border rounded px-2 py-1 w-full" value={v.meaning} onChange={(e) => updateAt(i, { meaning: e.target.value })} /></td>
                <td className="p-2">
                  <select className="border rounded px-2 py-1" value={v.type} onChange={(e) => updateAt(i, { type: e.target.value })}>
                    <option value="-ar">-ar (regular)</option>
                    <option value="-er">-er (regular)</option>
                    <option value="-ir">-ir (regular)</option>
                    <option value="irregular">irregular (use custom)</option>
                  </select>
                </td>
                <td className="p-2 min-w-[160px]"><input className="border rounded px-2 py-1 w-full" placeholder="e.g., core;gcse;stem-change" value={(v.tags || []).join(";")} onChange={(e) => updateAt(i, { tags: e.target.value.split(";").map((t) => t.trim()).filter(Boolean) })} /></td>
                <td className="p-2">
                  <IrregularEditor value={v.custom || {}} onChange={(custom) => updateAt(i, { custom })} />
                </td>
                <td className="p-2 text-right">
                  <button className="px-2 py-1 rounded bg-red-100 hover:bg-red-200" onClick={() => removeAt(i)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IrregularEditor({ value, onChange }) {
  const [tense, setTense] = useState("presente");

  const current = value[tense] || {};

  const setPerson = (personKey, form) => {
    const next = { ...value, [tense]: { ...(value[tense] || {}), [personKey]: form } };
    onChange(next);
  };

  return (
    <div className="border rounded-xl p-2">
      <div className="flex gap-2 items-center mb-2">
        <span className="text-sm">Tense:</span>
        <select className="border rounded px-2 py-1" value={tense} onChange={(e) => setTense(e.target.value)}>
          {TENSES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {PERSONS.map((p) => (
          <div key={p.key} className="text-sm">
            <div className="text-slate-500 mb-1">{p.label}</div>
            <input className="border rounded px-2 py-1 w-full" value={current[p.key] || ""} onChange={(e) => setPerson(p.key, e.target.value)} placeholder="custom form" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Small UI helpers ----------------
function MultiSelect({ label, all, selected, setSelected }) {
  const toggle = (key) => {
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  };
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="flex flex-wrap gap-2">
        {all.map((a) => (
          <button key={a.key} type="button" onClick={() => toggle(a.key)} className={`px-3 py-1 rounded-full border ${selected.includes(a.key) ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-slate-50"}`}>
            {a.label || a.key}
          </button>
        ))}
      </div>
    </div>
  );
}

function TagSelect({ label, all, selected, setSelected }) {
  if (!all || all.length === 0) return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="text-sm text-slate-500">No tags yet. Add tags to verbs in the manager (e.g., gcse;irregular).</div>
    </div>
  );
  const toggle = (key) => {
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  };
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="flex flex-wrap gap-2">
        {all.map((a) => (
          <button key={a} type="button" onClick={() => toggle(a)} className={`px-3 py-1 rounded-full border ${selected.includes(a) ? "bg-purple-600 text-white border-purple-600" : "bg-white hover:bg-slate-50"}`}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function labelOf(list, key) {
  return list.find((x) => x.key === key)?.label || key;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
