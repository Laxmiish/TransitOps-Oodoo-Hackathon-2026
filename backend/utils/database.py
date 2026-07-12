import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from a .env file (if it exists)
load_dotenv()

# PostgreSQL connection string
# On local, it defaults to the docker-compose db. On deployment, you set DATABASE_URL in your hosting service.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://transitops_user:transitops_password@localhost:5432/transitops_db")

# Fix Vercel AWS Lambda C-extension crashing by forcing the pure-python pg8000 driver
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
