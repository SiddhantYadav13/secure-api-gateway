"""
run.py — The entry point that actually STARTS the server.

WHY this file is separate from the app factory:
    - app/__init__.py knows HOW to build an app.
    - run.py decides to build one and RUN it.
    Separating "how to build" from "when to run" is what makes the factory
    pattern useful (e.g. tests build an app but never call run()).

Run it locally with:   python run.py
"""

import os

from dotenv import load_dotenv

# Load variables from a .env file into the environment BEFORE we build the app,
# so config.py can read them (SECRET_KEY, DATABASE_URL, etc.).
load_dotenv()

from app import create_app  # noqa: E402  (import after load_dotenv on purpose)

# Choose which config to use. Defaults to "development" if FLASK_ENV isn't set.
config_name = os.environ.get("FLASK_ENV", "development")
app = create_app(config_name)


if __name__ == "__main__":
    # host="0.0.0.0" makes the server reachable from outside the container later
    # (important for Docker). We read the port from the environment and default
    # to 5001 — on macOS, port 5000 is often occupied by AirPlay Receiver.
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
