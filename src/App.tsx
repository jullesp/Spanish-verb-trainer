import { useState, useEffect } from "react";
import "./App.css";

/** Tenses we support */
type TenseKey = "presente" | "preterito" | "imperfecto" | "futuro" | "condicional";

/** Minimal demo data */
const verbs: Record<string, Record<TenseKey, string[]>> = {
  hablar: {
    presente: ["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"],
    preterito: ["hablé", "hablaste", "habló", "hablamos", "hablasteis", "hablaron"],
    imperfecto: ["hablaba", "hablabas", "hablaba", "hablábamos", "hablabais", "hablaban"],
    futuro: ["hablaré", "hablarás", "hablará", "hablaremos", "hablaréis", "hablarán"],
    condicional: ["hablaría", "hablarías", "hablaría", "hablaríamos", "hablaríais", "hablarían"],
  },
  comer: {
    presente: ["como", "comes", "come", "comemos", "coméis", "comen"],
    preterito: ["comí", "comiste", "comió", "comimos", "comisteis", "comieron"],
    imperfecto: ["comía", "comías", "comía", "comíamos", "comíais", "comían"],
    futuro: ["comeré", "comerás", "comerá", "comeremos", "comeréis", "comerán"],
    condicional: ["comería", "comerías", "comería", "comeríamos", "comeríais", "comerían"],
  },
  vivir: {
    presente: ["vivo", "vives", "vive", "vivimos", "vivís", "viven"],
    preterito: ["viví", "viviste", "vivió", "vivimos", "vivisteis", "vivieron"],
    imperfecto: ["vivía", "vivías", "vivía", "vivíamos", "vivíais", "vivían"],
    futuro: ["viviré", "vivirás", "vivirá", "viviremos", "viviréis", "vivirán"],
    condicional: ["viviría", "vivirías", "viviría", "viviríamos", "viviríais", "vivirían"],
  },
};

const persons = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"];

const tenseLabels: Record<TenseKey, string> = {
  presente: "Presente",
  preterito: "Pretérito",
  imperfecto: "Imperfecto",
  futuro: "Futuro",
  condicional: "Condicional",
};

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [activeStudent, setActiveStudent] = useState<string | null>(null);

  // MULTI-SELECT tenses
  const [tenses, setTenses] = useState<TenseKey[]>(["presente"]);

  // Current question state
  const [currentVerb, setCurrentVerb] = useState<string>("hablar");
  const [currentPerson, setCurrentPerson] = useState<number>(0);
  const [currentTense, setCurrentTense] = useState<TenseKey>("presente");

  // Answer + feedback
  const [answer, setAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    // keep currentTense valid
    if (!tenses.includes(currentTense)) {
      setCurrentTense(tenses[0] || "presente");
    }
  }, [tenses]); // eslint-disable-line

  const toggleTense = (key: TenseKey) => {
    setTenses((prev) => {
      const next = prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key];
      const ensured = next.length ? next : ["presente"];
      // pick a visible current tense from selection
      setCurrentTense(randomOf(ensured));
      return ensured as TenseKey[];
    });
  };

  const newQuestion = () => {
    const v = randomOf(Object.keys(verbs));
    const p = Math.floor(Math.random() * persons.length);
    const t = randomOf(tenses);
    setCurrentVerb(v);
    setCurrentPerson(p);
    setCurrentTense(t);
    setAnswer("");
    setFeedback("");
  };

  const checkAnswer = () => {
    if (!activeStudent) {
      setFeedback("Please enter your name first.");
      return;
    }
    const expected = verbs[currentVerb][currentTense][currentPerson];
    const ok = answer.trim().toLowerCase() === expected.toLowerCase();
    setFeedback(
      ok
        ? `✅ Correct (${currentVerb} – ${persons[currentPerson]} – ${tenseLabels[currentTense]})`
        : `❌ Incorrect. Expected "${expected}" (${tenseLabels[currentTense]})`
    );
  };

  if (!activeStudent) {
    return (
      <main>
        <h1>Spanish Verb Trainer</h1>
        <div className="card">
          <h2>Student login</h2>
          <input
            type="text"
            placeholder="Your name"
            onChange={(e) => setActiveStudent(e.target.value.trim() || null)}
          />
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1>Spanish Verb Trainer</h1>
      <p className="muted">Logged in as <strong>{activeStudent}</strong></p>

      <div className="card">
        <h2>Select tenses (multi-select)</h2>
        <div className="row">
          {(["presente","preterito","imperfecto","futuro","condicional"] as TenseKey[]).map((key) => {
            const active = tenses.includes(key);
            return (
              <button
                key={key}
                type="button"
                className="chip"
                data-active={active}
                aria-pressed={active}
                onClick={() => toggleTense(key)}
              >
                {tenseLabels[key]}
              </button>
            );
          })}
        </div>
        <small className="muted">Selected: {tenses.map((t)=>tenseLabels[t]).join(", ")}</small>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Conjugate</h2>
        <p>
          Verb: <strong>{currentVerb}</strong> · Person: <strong>{persons[currentPerson]}</strong> ·{" "}
          Tense: <strong>{tenseLabels[currentTense]}</strong>
        </p>

        <input
          type="text"
          placeholder="Type the conjugation"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
        />

        <div className="row" style={{ marginTop: 10 }}>
          <button className="primary" type="button" onClick={checkAnswer}>Check</button>
          <button type="button" onClick={newQuestion}>Next</button>
        </div>

        {feedback && <p style={{ marginTop: 12 }}>{feedback}</p>}
      </div>
    </main>
  );
}
