from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str
    DB_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    CORS_ALLOW_ORIGINS: str
    GEMINI_API_KEY: str
    ACCOUNT_SID: str = ""
    AUTH_TOKEN: str = ""
    TWILIO_SMS_FROM: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
