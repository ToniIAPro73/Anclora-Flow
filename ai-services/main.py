from fastapi import FastAPI

app = FastAPI()

@app.get("/ai/ping")
def ping():
    return {"message": "AI Service ready 🚀"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
