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
    JAAS_APP_ID: str = ""
    JAAS_KEY_ID: str = ""


    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
