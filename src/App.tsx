import { useState } from "react";
import "./App.css";

// All tenses available
type TenseKey =
  | "presente"
  | "preterito"
  | "imperfecto"
  | "futuro"
  | "condicional";

// Example minimal verb data — replace with your real verb set
const verbs: Record<string, any> = {
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

// Persons
const persons = [
  "yo",
  "tú",
  "él/ella",
  "nosotros",
  "vosotros",
  "ellos/ellas",
];

const tenseLabels: Record<TenseKey, string> = {
  presente: "Presente",
  preterito: "Pretérito",
  imperfecto: "Imperfecto",
  futuro: "Futuro",
  condicional: "Condicional",
};

export default function App() {
  const [activeStudent, setActiveStudent] = useState<string | null>(null);
  const [tenses, setTenses] = useState<TenseKey[]>(["presente"]);
  const [verb, setVerb] = useState("hablar");
  const [personIndex, setPersonIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const toggleTense = (tense: TenseKey) => {
    setTenses((prev) =>
      prev.includes(tense)
        ? prev.filter((t) => t !== tense)
        : [...prev, tense]
    );
  };

  const newQuestion = () => {
    const verbsList = Object.keys(verbs);
    const randomVerb = verbsList[Math.floor(Math.random() * verbsList.length)];
    const randomPerson = Math.floor(Math.random() * persons.length);
    setVerb(randomVerb);
    setPersonIndex(randomPerson);
    setAnswer("");
    setFeedback("");
  };

  const checkAnswer = () => {
    if (!activeStudent) {
      setFeedback("Please enter your name first.");
      return;
    }

    const randomTense =
      tenses[Math.floor(Math.random() * tenses.length)] || "presente";
    const expected = verbs[verb][randomTense][personIndex];
    if (answer.trim().toLowerCase() === expected.toLowerCase()) {
      setFeedback(
        `✅ Correct (${verb} – ${persons[personIndex]} – ${tenseLabels[randomTense]})`
      );
    } else {
      setFeedback(
        `❌ Incorrect. Expected "${expected}" (${tenseLabels[randomTense]})`
      );
    }
  };

  if (!activeStudent)
    return (
      <main>
        <h1>Spanish Verb Trainer</h1>
        <p>Enter your name to start:</p>
        <input
          type="text"
          onChange={(e) => setActiveStudent(e.target.value)}
          placeholder="Your name"
        />
      </main>
    );

  return (
    <main>
      <h1>Spanish Verb Trainer</h1>
      <p>Logged in as: <strong>{activeStudent}</strong></p>

      <div className="card">
        <h2>Select Tenses</h2>
        <div className="row">
          {(
            [
              ["presente", "Presente"],
              ["preterito", "Pretérito"],
              ["imperfecto", "Imperfecto"],
              ["futuro", "Futuro"],
              ["condicional", "Condicional"],
            ] as [TenseKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`chip ${tenses.includes(key) ? "active" : ""}`}
              onClick={() => toggleTense(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Conjugate</h2>
        <p>
          <strong>{persons[personIndex]}</strong> — <strong>{verb}</strong>
        </p>

        <input
          type="text"
          placeholder="Type conjugation"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
        />

        <div className="row" style={{ marginTop: 10 }}>
          <button className="primary" onClick={checkAnswer}>
