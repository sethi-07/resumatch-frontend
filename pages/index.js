import { useState, useEffect } from "react";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [missingKeywords, setMissingKeywords] = useState([]);

  const analyze = async () => {
    setError("");
    setResult(null);

    if (!resume.trim() || !jobDesc.trim()) {
      setError("Both fields are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:8000/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resume,
          job_description: jobDesc,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Something went wrong.");
      }

      const data = await res.json();
      setResult(data);
      setMissingKeywords(data.missing_keywords || []);
    } catch (err) {
      setError(err.message || "Server took too long to respond.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-8">

      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-teal-600">
          Resumatch
        </h1>

      </div>

      <div className="max-w-4xl mx-auto grid gap-4">
        <textarea
          className="p-4 rounded border bg-white dark:bg-zinc-800
          text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
          rows="6"
          placeholder="Paste your resume here..."
          value={resume}
          onChange={(e) => setResume(e.target.value)}
        />

        <textarea
          className="p-4 rounded border bg-white dark:bg-zinc-800
          text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700"
          rows="6"
          placeholder="Paste job description here..."
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
        />

        <button
          onClick={analyze}
          disabled={loading}
          className="bg-black dark:bg-black text-white dark:text-white
          p-3 rounded font-semibold hover:opacity-90 transition duration-300 hover:bg-teal-800"
        >
          {loading ? "Analyzing..." : "Analyze Match"}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
            ⚠ {error}
          </div>
        )}

        {result && !error && (
          <div className="mt-8 p-6 rounded-2xl shadow-xl bg-white dark:bg-gray-900 border dark:border-gray-700">

            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              ATS Match Analysis
            </h2>

            <div className="mb-6">
              <div
                className={`text-4xl font-bold ${result.final_match_percentage >= 75
                  ? "text-green-500"
                  : result.final_match_percentage >= 50
                    ? "text-yellow-500"
                    : "text-red-500"
                  }`}
              >
                {result.final_match_percentage}%
              </div>

              <p className="text-gray-500 dark:text-gray-400">
                Overall Match Score
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Semantic Score
                </h3>
                <p className="text-xl font-bold text-blue-500">
                  {result.semantic_score}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Skill Overlap
                </h3>
                <p className="text-xl font-bold text-purple-500">
                  {result.skill_overlap_score}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Impact Score
                </h3>
                <p className="text-xl font-bold text-orange-500">
                  {result.impact_score}%
                </p>
              </div>

            </div>

            {/* Missing Skills */}
            {result.missing_keywords?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm rounded-full bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div >
  );
}
