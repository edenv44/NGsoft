import datetime

from fastapi import FastAPI, HTTPException, Depends, Body
import uvicorn
from sqlalchemy import select
from sqlalchemy.orm import Session

from sql_connector import LoginRequest, SessionLocal, users_table, MainTask, UserTaskGroup, MainTaskUpdate, \
    MainTaskCreate, Task, TaskUpdate, TaskCreate, User, UserUpdate, UserCreate, TaskCreateForOther, TaskShare, \
    UserActiveStatus

app = FastAPI()  # create app

@app.get("/")
async def say_hi():
    return "HI"
@app.post("/login")
async def login(data: LoginRequest):
    session = SessionLocal()
    try:
        stmt = select(users_table).where(users_table.c.username == data.username)
        result = session.execute(stmt).fetchone()
        if not result:
            raise HTTPException(status_code=400, detail="User not found")
        if not result.is_active:
            raise HTTPException(status_code=400, detail="User is inactive")
        if result.password != data.password:
            raise HTTPException(status_code=400, detail="Incorrect password")
        return {"message": "Login successful", "user_id": result.user_id, "username": result.username}
    finally:
        session.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

################################################################################### get end points
@app.get("/main_task/{user_id}") # get all main task by user id
def get_tasks(user_id: int):
    session = SessionLocal()
    try:
        # tasks assigned by user
        assigned_tasks = session.query(MainTask).filter(MainTask.assigned_by == user_id).all()

        # tasks appearing in table user_task_group_id
        group_tasks = session.query(MainTask).join(UserTaskGroup, MainTask.mTask_id == UserTaskGroup.task_group_id)\
            .filter(UserTaskGroup.user_id == user_id).all()

        # איחוד הרשימות והסרת כפילויות
        all_tasks = {t.mTask_id: t for t in assigned_tasks + group_tasks}.values()

        if not all_tasks:
            raise HTTPException(status_code=404, detail="No tasks found for this user")

        return [{"task_id": t.mTask_id, "task_name": t.mTask_name, "is_active": t.is_active} for t in all_tasks]

    finally:
        session.close()

@app.get("/main_tasks", response_model=list[dict]) # get all main tasks
def get_all_main_tasks():
    session = SessionLocal()
    main_tasks = session.query(MainTask).all()

    if not main_tasks:
        raise HTTPException(status_code=404, detail="No main tasks found")

    result = [
        {
            "mTask_id": task.mTask_id,
            "mTask_name": task.mTask_name,
            "assigned_by": task.assigned_by,
            "is_active": task.is_active,
            "creation_date": task.creation_date,
            "modification_date": task.modification_date
        }
        for task in main_tasks
    ]

    return result

@app.get("/tasks/{task_id}", response_model=dict) # get tasks by id
def get_task(task_id: int):
    session = SessionLocal()
    db_task = session.query(Task).filter(Task.task_id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "task_id": db_task.task_id,
        "task_name": db_task.task_name,
        "status": db_task.status.value,
        "assigned_by": db_task.assigned_by,
        "assigned_to": db_task.assigned_to,
        "task_group_id": db_task.task_group_id,
        "creation_date": db_task.creation_date,
        "modification_date": db_task.modification_date,
    }


@app.get("/tasks/", response_model=list[dict]) # get all tasks
def get_all_tasks():
    session = SessionLocal()
    tasks = session.query(Task).all()
    return [
        {
            "task_id": t.task_id,
            "task_name": t.task_name,
            "status": t.status.value,
            "assigned_by": t.assigned_by,
            "assigned_to": t.assigned_to,
            "task_group_id": t.task_group_id,
        }
        for t in tasks
    ]


@app.get("/users/{user_id}/main-tasks", response_model=dict) # get all main tasks with containing tasks of a user
def get_user_main_tasks_with_tasks(user_id: int):
    session = SessionLocal()

    # check if user exists
    user = session.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # main tasks this user has created
    created_main_tasks = session.query(MainTask).filter(MainTask.assigned_by == user_id).all()

    # main tasks shared with this user
    shared_main_task_ids = session.query(UserTaskGroup.task_group_id).filter(UserTaskGroup.user_id == user_id).all()
    shared_main_task_ids = [row[0] for row in shared_main_task_ids]

    shared_main_tasks = (
        session.query(MainTask)
        .filter(MainTask.mTask_id.in_(shared_main_task_ids))
        .all()
    )

    # unite both main tasks
    all_main_tasks = list({t.mTask_id: t for t in (created_main_tasks + shared_main_tasks)}.values())

    # in case there aren't relevant main tasks
    if not all_main_tasks:
        return {"user": user.username, "main_tasks": []}

    # return data neatly
    result = []
    for main_task in all_main_tasks:
        tasks = session.query(Task).filter(Task.task_group_id == main_task.mTask_id).all()
        result.append({
            "main_task_id": main_task.mTask_id,
            "main_task_name": main_task.mTask_name,
            "created_by": main_task.assigned_by,
            "is_active": main_task.is_active,
            "creation_date": main_task.creation_date,
            "modification_date": main_task.modification_date,
            "tasks": [
                {
                    "task_id": task.task_id,
                    "task_name": task.task_name,
                    "status": task.status,
                    "assigned_by": task.assigned_by,
                    "assigned_to": task.assigned_to,
                    "creation_date": task.creation_date,
                    "modification_date": task.modification_date
                }
                for task in tasks
            ]
        })
    return {
        "user": user.username,
        "main_tasks": result
    }


@app.get("/users/{user_id}/main-tasks", response_model=dict) # get all users main tasks (by user id)
def get_user_main_tasks(user_id: int):
    session = SessionLocal()

    # check if user exists
    user = session.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # main tasks created by user
    created_main_tasks = session.query(MainTask).filter(MainTask.assigned_by == user_id).all()

    # main tasks shared with the user
    shared_main_task_ids = (
        session.query(UserTaskGroup.task_group_id)
        .filter(UserTaskGroup.user_id == user_id)
        .distinct()
        .all()
    )
    shared_main_task_ids = [row[0] for row in shared_main_task_ids]
    shared_main_tasks = []
    if shared_main_task_ids:
        shared_main_tasks = (
            session.query(MainTask)
            .filter(MainTask.mTask_id.in_(shared_main_task_ids))
            .all()
        )

    # unite both main tasks with no duplicates
    all_main_tasks = {mt.mTask_id: mt for mt in created_main_tasks + shared_main_tasks}.values()

    # return data neatly
    result = [
        {
            "main_task_id": mt.mTask_id,
            "main_task_name": mt.mTask_name,
            "assigned_by": mt.assigned_by,
            "is_active": mt.is_active,
            "creation_date": mt.creation_date,
            "modification_date": mt.modification_date
        }
        for mt in all_main_tasks
    ]
    return {
        "user": user.username,
        "main_tasks": result
    }


@app.get("/users/", response_model=list[dict]) # get all users
def get_all_users():
    session = SessionLocal()
    users = session.query(User).all()
    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "is_active": u.is_active,
            "creation_date": u.creation_date,
            "modification_date": u.modification_date,
        }
        for u in users
    ]


@app.get("/users/{user_id}", response_model=dict) # get user by id
def get_user(user_id: int):
    session = SessionLocal()
    user = session.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.user_id,
        "username": user.username,
        "is_active": user.is_active,
        "creation_date": user.creation_date,
        "modification_date": user.modification_date,
    }


################################################################################### post end points
@app.post("/main_task") # create main task
def create_main_task(task: MainTaskCreate):
    session = SessionLocal()
    try:
        new_task = MainTask(mTask_name=task.mTask_name, assigned_by=task.assigned_by)
        session.add(new_task)
        session.commit()
        session.refresh(new_task)
        return {"message": "Task created successfully", "task_id": new_task.mTask_id}
    finally:
        session.close()


@app.post("/tasks/", response_model=dict) # create task
def create_task(task: TaskCreate):
    session = SessionLocal()
    new_task = Task(**task.dict())
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return {"message": "Task created successfully", "task_id": new_task.task_id}


@app.post("/users/", response_model=dict) # create new user
def create_user(user: UserCreate):
    session = SessionLocal()
    new_user = User(**user.dict())
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.user_id}


@app.post("/main-tasks/{main_task_id}/share/{user_id}", response_model=dict) # share main task with user by both ids
def share_main_task_with_user(main_task_id: int, user_id: int):
    session = SessionLocal()

    # check if user and main task exist
    user = session.query(User).filter(User.user_id == user_id).first()
    main_task = session.query(MainTask).filter(MainTask.mTask_id == main_task_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not main_task:
        raise HTTPException(status_code=404, detail="Main Task not found")

    # check if user already linked to this main task
    existing = session.query(UserTaskGroup).filter_by(user_id=user_id, task_group_id=main_task_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already shared with this Main Task")

    # create new connection
    new_share = UserTaskGroup(user_id=user_id, task_group_id=main_task_id)
    session.add(new_share)
    session.commit()
    return {"message": f"User {user.username} successfully added to main task {main_task.mTask_name}"}


@app.post("/tasks/assign", response_model=dict) # user assigns other user a new task
def create_task_for_other(task_data: TaskCreateForOther):
    session = SessionLocal()

    # check main task exists
    main_task = session.query(MainTask).filter(MainTask.mTask_id == task_data.task_group_id).first()
    if not main_task:
        raise HTTPException(status_code=404, detail="Main Task (Task Group) not found")

    # check both users exist
    assigned_by = session.query(User).filter(User.user_id == task_data.assigned_by).first()
    assigned_to = session.query(User).filter(User.user_id == task_data.assigned_to).first()

    if not assigned_by:
        raise HTTPException(status_code=404, detail="Assigning user not found")
    if not assigned_to:
        raise HTTPException(status_code=404, detail="Assigned-to user not found")

    # if user is not connected to main task then he/she will be connected automatically
    existing_link = session.query(UserTaskGroup).filter_by(
        user_id=task_data.assigned_to,
        task_group_id=task_data.task_group_id
    ).first()

    if not existing_link:
        new_link = UserTaskGroup(
            user_id=task_data.assigned_to,
            task_group_id=task_data.task_group_id
        )
        session.add(new_link)
        session.commit()  # save new connection

    # create task (no need to enter dates and times)
    new_task = Task(
        task_name=task_data.task_name,
        assigned_by=task_data.assigned_by,
        assigned_to=task_data.assigned_to,
        task_group_id=task_data.task_group_id
    )

    session.add(new_task)
    session.commit()
    session.refresh(new_task)

    return {
        "message": "Task created successfully and user linked to the task group (if needed)",
        "task_id": new_task.task_id,
        "assigned_to": assigned_to.username,
        "task_group_id": task_data.task_group_id
    }


@app.post("/tasks/share/{task_id}/{target_user_id}")
def share_task(task_id: int, target_user_id: int, current_user_id: int = Body(..., embed=True)):
    session = SessionLocal()

    # בדוק אם המשימה קיימת
    task = session.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # בדוק אם המשתמש היעד קיים
    target_user = session.query(User).filter(User.user_id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # בדוק אם המשימה כבר משותפת עם המשתמש
    existing_share = session.query(TaskShare).filter_by(
        user_id=target_user_id,
        task_id=task_id
    ).first()
    if existing_share:
        raise HTTPException(status_code=400, detail="Task already shared with this user")

    # צור שיתוף חדש
    new_share = TaskShare(user_id=target_user_id, task_id=task_id)
    session.add(new_share)

    # ודא שגם המשתמש הנוכחי רשום כמשתף (אם לא)
    current_share = session.query(TaskShare).filter_by(
        user_id=current_user_id,
        task_id=task_id
    ).first()
    if not current_share:
        session.add(TaskShare(user_id=current_user_id, task_id=task_id))

    session.commit()
    session.close()

    return {"message": f"Task {task_id} successfully shared with user {target_user_id}"}


################################################################################### put end points
@app.put("/main_task/{task_id}") # edit main task by main task id
def update_task(task_id: int, updated_task: MainTaskUpdate):
    session = SessionLocal()
    try:
        task = session.query(MainTask).filter(MainTask.mTask_id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if updated_task.mTask_name is not None:
            task.mTask_name = updated_task.mTask_name
        if updated_task.is_active is not None:
            task.is_active = updated_task.is_active
        if updated_task.assigned_by is not None:
            task.assigned_by = updated_task.assigned_by
        session.commit()
        session.refresh(task)
        return {"message": "Task updated successfully", "task_id": task.mTask_id}
    finally:
        session.close()


@app.put("/tasks/{task_id}", response_model=dict) # edit task by task id
def update_task(task_id: int, task_update: TaskUpdate):
    session = SessionLocal()
    db_task = session.query(Task).filter(Task.task_id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task_update.dict(exclude_unset=True).items():
        setattr(db_task, key, value)
    session.commit()
    session.refresh(db_task)
    return {"message": f"Task {task_id} updated successfully"}


@app.put("/users/{user_id}", response_model=dict) # edit user by id (edit username and/or password)
def update_user(user_id: int, user_update: UserUpdate):
    session = SessionLocal()
    user = session.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)

    session.commit()
    session.refresh(user)
    return {"message": f"User {user_id} updated successfully"}


@app.put("/users/{user_id}/toggle_active") # change users active status by user id (done by different user)
def toggle_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    return {"message": f"User {user.user_id} active status changed to {user.is_active}"}


################################################################################### delete end points
@app.delete("/main_task/{task_id}") # delete main task by id
def delete_task(task_id: int):
    session = SessionLocal()
    try:
        task = session.query(MainTask).filter(MainTask.mTask_id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        session.delete(task)
        session.commit()
        return {"message": "Task deleted successfully"}
    finally:
        session.close()


@app.delete("/tasks/{task_id}", response_model=dict) # delete task by id
def delete_task(task_id: int):
    session = SessionLocal()
    db_task = session.query(Task).filter(Task.task_id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(db_task)
    session.commit()
    return {"message": f"Task {task_id} deleted successfully"}


@app.delete("/users/{user_id}", response_model=dict) # delete a user by id
def delete_user(user_id: int):
    session = SessionLocal()
    user = session.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"message": f"User {user_id} deleted successfully"}


@app.delete("/main-tasks/{main_task_id}/remove/{user_id}", response_model=dict)
# delete connection between main task and user (by both their ids)
# also deleting connection between the user and all tasks with in that main task
def remove_user_from_main_task(main_task_id: int, user_id: int):
    session = SessionLocal()

    # check if connection exists
    link = session.query(UserTaskGroup).filter_by(user_id=user_id, task_group_id=main_task_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="User is not linked to this Main Task")

    # remove user from all tasks listed in this main task
    tasks_to_update = session.query(Task).filter(
        Task.task_group_id == main_task_id,
        Task.assigned_to == user_id
    ).all()
    for task in tasks_to_update:
        task.assigned_to = None  # remove connection from user

    # remove connection from main task
    session.delete(link)
    session.commit()
    return {
        "message": f"User {user_id} removed from main task {main_task_id} and unassigned from all its tasks",
        "tasks_updated": len(tasks_to_update)
    }




if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

