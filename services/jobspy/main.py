from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from jobspy import scrape_jobs
import pandas as pd
import logging

app = FastAPI(title="Jobflow JobSpy Service", version="1.0.0")

# Setup safe internal logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobSearchInput(BaseModel):
    query: str
    location: Optional[str] = None
    remote: Optional[bool] = False
    limit: Optional[int] = 10
    page: Optional[int] = 1

@app.get("/healthz")
def health_check():
    return {"status": "ok"}

@app.post("/api/jobs/scrape")
def scrape(search_input: JobSearchInput):
    try:
        # Prevent massive scrapes
        if search_input.limit > 50:
            search_input.limit = 50
            
        offset = (search_input.page - 1) * search_input.limit
        if offset < 0:
            offset = 0

        # Note: JobSpy is blocking; in a real scalable system, this would be Celery/RQ.
        # This implementation serves the minimal Phase 4 requirement.
        jobs_df: pd.DataFrame = scrape_jobs(
            site_name=["linkedin", "indeed", "glassdoor"],
            search_term=search_input.query,
            location=search_input.location,
            results_wanted=search_input.limit,
            is_remote=search_input.remote,
            offset=offset
        )

        if jobs_df.empty:
            return {"jobs": [], "total": 0}

        # Replace NaNs with None for JSON serialization
        jobs_df = jobs_df.where(pd.notnull(jobs_df), None)

        # Normalize to our JobProviderResult format as much as possible
        normalized_jobs = []
        for _, row in jobs_df.iterrows():
            normalized_jobs.append({
                "externalId": str(row.get("id")) if row.get("id") else None,
                "title": str(row.get("title", "Unknown")),
                "company": str(row.get("company", "Unknown")),
                "location": str(row.get("location")) if row.get("location") else None,
                "url": str(row.get("job_url")) if row.get("job_url") else None,
                "salary": float(row.get("min_amount")) if row.get("min_amount") else None, # Simplified
                "remote": str(row.get("is_remote", False)),
                "createdAt": str(row.get("date_posted")) if row.get("date_posted") else None,
                "metadata": {
                    "source": str(row.get("site", "jobspy")),
                    "job_type": str(row.get("job_type")) if row.get("job_type") else None
                }
            })

        return {
            "jobs": normalized_jobs,
            "total": len(normalized_jobs),
            "page": search_input.page
        }

    except Exception as e:
        logger.error(f"JobSpy scrape failed: {str(e)}")
        # We do not return the raw exception string to avoid leaking internal paths
        raise HTTPException(status_code=500, detail="Internal scraping error")
