# Secure API Gateway — Backend

The security "brain" of the platform: authentication, cryptography, integrity
checks, replay protection, risk scoring, logging, and dashboard APIs.

## Tech
- **Flask** — web framework
- **SQLAlchemy** — database ORM (SQLite locally → MySQL later, no code changes)
- Built with the **application factory** pattern for clean, testable structure.

## Project layout (grows each phase)
```
backend/
├── app/
│   ├── __init__.py       # create_app() — the application factory
│   ├── config.py         # dev / testing / production settings
│   └── routes/
│       └── health.py     # /api/health liveness check
├── run.py                # entry point: builds an app and runs it
├── requirements.txt      # pinned Python dependencies
├── .env.example          # template for environment variables (committed)
└── .env                  # your real secrets (git-ignored)
```

## Setup & run (first time)
```bash
cd backend
python3 -m venv venv                 # create isolated environment
source venv/bin/activate             # activate it (Windows: venv\Scripts\activate)
pip install -r requirements.txt      # install dependencies
cp .env.example .env                 # create your local config
python run.py                        # start the server
```

Server runs at **http://localhost:5001**.
Verify it:
```bash
curl http://localhost:5001/api/health
# -> {"status":"ok","service":"secure-api-gateway","phase":1,...}
```

> Note: we use port **5001**, not 5000 — macOS reserves 5000 for AirPlay Receiver.
