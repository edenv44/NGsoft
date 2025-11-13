import datetime
import enum
from typing import List

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, Boolean, TIMESTAMP, select, \
    SmallInteger, ForeignKey, Enum, func, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base


DATABASE_URL = "mysql+pymysql://admin:Aa123456@database-1.ccnmayg4cx2m.us-east-1.rds.amazonaws.com/task_db"

engine = create_engine(DATABASE_URL)
metadata = MetaData()
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


################################################################################### login

class LoginRequest(BaseModel): # login parameters request
    username: str
    password: str


################################################################################### users

users_table = Table( # define users table
    "users", metadata,
    Column("user_id", Integer, primary_key=True, autoincrement=True),
    Column("username", String(20), nullable=False),
    Column("password", String(30), nullable=False),
    Column("is_active", Boolean, default=True),
    Column("creation_date", TIMESTAMP),
    Column("modification_date", TIMESTAMP)
)


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(20), nullable=False)
    password = Column(String(30), nullable=False)
    is_active = Column(SmallInteger, default=1)
    creation_date = Column(TIMESTAMP, server_default=func.now())
    modification_date = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class UserCreate(BaseModel): # create user
    username: str
    password: str
    is_active: int | None = 1


class UserUpdate(BaseModel): # edit user
    username: str | None = None
    password: str | None = None
    is_active: int | None = None


class UserActiveStatus(BaseModel): # change user active status
    target_user_id: int


################################################################################### main task

class MainTask(Base):
    __tablename__ = "main_task"
    mTask_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mTask_name = Column(String(255), nullable=False)
    is_active = Column(SmallInteger, default=1)
    assigned_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    creation_date = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    modification_date = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP", onupdate="CURRENT_TIMESTAMP")


class MainTaskCreate(BaseModel): # create main task
    mTask_name: str
    assigned_by: int | None = None


class MainTaskUpdate(BaseModel): # edit main task
    mTask_name: str | None = None
    is_active: int | None = None
    assigned_by: int | None = None


class MainTaskDelete(BaseModel): # delete main task
    mTask_id: int



################################################################################### user task group id

class UserTaskGroup(Base):
    __tablename__ = "user_task_group_id"
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    task_group_id = Column(Integer, ForeignKey("main_task.mTask_id"), primary_key=True)


class ShareMainTaskRequest(BaseModel): # connect main task to user
    task_group_id: int
    user_ids: List[int]


################################################################################### task

class TaskStatus(enum.Enum): # possibilities for task status
    PENDING = "PENDING"
    DONE = "DONE"
    REJECTED = "REJECTED"


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, autoincrement=True)
    task_name = Column(String(255), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    assigned_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL", onupdate="CASCADE"))
    assigned_to = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL", onupdate="CASCADE"))
    task_group_id = Column(Integer, ForeignKey("main_task.mTask_id", ondelete="SET NULL", onupdate="CASCADE"))
    creation_date = Column(TIMESTAMP)
    modification_date = Column(TIMESTAMP)


class TaskCreate(BaseModel): # create task
    task_name: str
    status: TaskStatus = TaskStatus.PENDING
    assigned_by: int | None = None
    assigned_to: int | None = None
    task_group_id: int | None = None


class TaskUpdate(BaseModel): # edit task
    task_name: str | None = None
    status: TaskStatus | None = None
    assigned_by: int | None = None
    assigned_to: int | None = None
    task_group_id: int | None = None


class ShareTaskRequest(BaseModel): # share task between users
    task_id: int
    target_user_id: int
    current_user_id: int

class TaskCreateForOther(BaseModel): # create a task and assign different user
    task_name: str
    assigned_by: int       # creating user
    assigned_to: int       # assigned user
    task_group_id: int     # main task to which the task will be assigned

class TaskShare(Base):
    __tablename__ = "task_share"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    task_id = Column(Integer, ForeignKey("task.task_id", ondelete="CASCADE"))
    creation_date = Column(DateTime(timezone=True), server_default=func.now())

