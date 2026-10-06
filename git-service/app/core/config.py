from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "Git Processing Service"
    VERSION: str = "1.0.0"
    
    # File storage
    REPOS_DIR: Path = Path("./repos")
    
    # Git settings
    RENAME_THRESHOLD: float = 0.5  # 50% rename detection threshold
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Create directories
settings.REPOS_DIR.mkdir(parents=True, exist_ok=True)
