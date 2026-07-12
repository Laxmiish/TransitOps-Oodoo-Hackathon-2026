import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from a .env file (if it exists)
load_dotenv()

# PostgreSQL connection string
# On local, it defaults to the docker-compose db. On deployment, you set DATABASE_URL in your hosting service.
import ssl

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://transitops_user:transitops_password@localhost:5432/transitops_db")

connect_args = {}

# Fix for Vercel AWS Lambda + Neon
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    # pg8000 throws TypeError if 'sslmode' is in the URL string
    if "?" in SQLALCHEMY_DATABASE_URL:
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.split("?")[0]
        
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    
    # Neon requires SSL, so we provide it explicitly to pg8000
    connect_args["ssl_context"] = ssl.create_default_context()

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
