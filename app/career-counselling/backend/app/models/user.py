from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum
from bson import ObjectId


class Category(str, Enum):
    OPEN = "open"
    EWS = "ews"
    OBC_NCL = "obc-ncl"
    SC = "sc"
    ST = "st"
    OPEN_PWD = "open-pwd"
    EWS_PWD = "ews-pwd"
    OBC_NCL_PWD = "obc-ncl-pwd"
    SC_PWD = "sc-pwd"
    ST_PWD = "st-pwd"
    UNSPECIFIED = ""


class UserBase(BaseModel):
    firstName: Optional[str] = None
    middleName: Optional[str] = None
    lastName: Optional[str] = None
    email: EmailStr
    gender: Optional[str] = None
    category: Optional[Category] = Category.UNSPECIFIED
    home_state: Optional[str] = None
    mobileNo: Optional[str] = None
    type: str = "free"
    isExpert: bool = False
    expertId: Optional[str] = None
    isAdmin: bool = False
    wallet: int = 200  # Default wallet balance of 200 coins
    following: list[str] = []
    followers: list[str] = []


class User(UserBase):
    # Change ObjectId to str
    id: Optional[str] = Field(alias="_id", default=None)
    password: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        validate_assignment = True


class UserCreate(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    gender: str
    category: str
    mobileNo: str


class UserSearchResponse(BaseModel):
    firstName: str
    lastName: str


class UserWithPassword(UserBase):
    hashedPassword: str


class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    lastName: str
    middleName: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    middleName: Optional[str] = None
    lastName: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    home_state: Optional[str] = None
    mobileNo: Optional[str] = None
    wallet: Optional[int] = None
    status: Optional[str] = None  # Add status field to support user status updates


class UserInDB(User):
    password: str
