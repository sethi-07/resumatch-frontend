from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import numpy as np

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://resumatch123.vercel.app", 
        "http://resumatch123.vercel.app",
        "http://localhost:3000", 
        "http://localhost:3001", 
    ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputData(BaseModel):
    resume: str
    job_description: str


@app.get("/")
def home():
    return {"message": "ResumeMatch API Running 🚀"}


@app.post("/api/match")
def match_resume(data: InputData):

    if not data.resume.strip() or not data.job_description.strip():
        raise HTTPException(status_code=400, detail="Inputs cannot be empty")

    resume = data.resume.lower()
    jd = data.job_description.lower()

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf = vectorizer.fit_transform([resume, jd])

    semantic_score = cosine_similarity(
        tfidf[0:1], tfidf[1:2]
    )[0][0]

    skill_vectorizer = TfidfVectorizer(stop_words="english", max_features=20)
    skill_matrix = skill_vectorizer.fit_transform([jd])
    keywords = skill_vectorizer.get_feature_names_out()

    missing_keywords = [
        word for word in keywords if word not in resume
    ]

    skill_overlap_score = (
        (len(keywords) - len(missing_keywords)) / len(keywords)
        if len(keywords) > 0 else 0
    )

    impact_pattern = r"\b\d+%?|\b\d+x\b"
    resume_impacts = re.findall(impact_pattern, resume)
    jd_impacts = re.findall(impact_pattern, jd)

    impact_score = min(len(resume_impacts), len(jd_impacts)) / max(len(jd_impacts), 1)

    final_score = (
        semantic_score * 0.5 +
        skill_overlap_score * 0.3 +
        impact_score * 0.2
    )

    return {
        "final_match_percentage": round(float(final_score) * 100, 2),
        "semantic_score": round(float(semantic_score) * 100, 2),
        "skill_overlap_score": round(float(skill_overlap_score) * 100, 2),
        "impact_score": round(float(impact_score) * 100, 2),
        "missing_keywords": missing_keywords
    }
