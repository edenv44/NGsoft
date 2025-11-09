tasks app Web Platform
A full-stack web application for an application, enabling browsing, filtering of day to day work tasks online. Includes admin functionality capabilities for every user, user login, responsive design, and a clean user experience.

Project Overview
tasks app is an assistive project simulating a complete online list of work tasks to be done, organaized according to main projects.
Users can browse tasks, filter by projects, view detailed descriptions, share tasks with other users incase of hardships, add tasks and projects to users, edit their own username and/or password and logout.

The system integrates client-side and server-side technologies with connection to a remote MySQL database.

Key Features
Responsive design: mobile-friendly layout with dynamic scaling.

login page:
display a request for user login information such as username and password. 


Homepage:
projects display with filtering.
tasks contained in each project.
possibility to edit tasks and project.
option to edit own user information.
observation of tasks and project details and completion status.

Dynamic tasks and project data pulled from MySQL.
Search, project or task filtering and status filtering.
"Create task" and "Create main task" buttons.
"More Details" option showing extended information about every task, by simply clicking the task.


user, main_task, tasks, user_task_group_id tables (SQL)
Displayed in back end folder
Written in SQL programming language
As part of the file also defined defualt entrees of  users, tasks and main tasks.


Main back end file filled with URL links above the functions they link to, to be used by user in front end client actions.
Written in Python programming language in PyCharm workspace.

Front end algorithm written in HTML,CSS and TypeScript compiling Angular programming language.


Main tables include:

task – All task details: task_name, task_id, assigned_by, assigned_to, task_group_id, status, creation_date and modification_date.
user – All registered users and their profile data: user_id, username, password, is_active, creation_date and modification_date.
main_task – organizing tasks by project: mTask_id, mTask_name, is_active, assigned_by, creation_date and modification_date.
user_task_grou_id – connects a main task to a user: user_id, task_group_id, creation_date and modification_date.


Notes
All design and layout is defined in CSS and HTML files.
Front end algorithm includes HTML/CSS/TS only.
task data is dynamically pulled from the database.
Admin tools are provided for every user and they include: create main task, create task, add user, edit my profile, change user status and delete user.

Create tasks button (adds to database)
Fill all tasks details such as task name, project to be assigned to and user to complete it, and add task to database.

Create main task button (main task = project; adds to database)
Pop up window will appear requesting to fill in one main task detail witch is main task name, and add main task to database.
After a main task is created, once a task is created within the main task and assigned to a user (who is not assigned to the main task) the user will be automatically assigned to the main task as well as the task itself.

Add user button (adds to database)
Pop up window will appear requesting to fiil in username and password for new user, creation date and modification date will be filled in automatically.
Once create user button is clicked user is free to log in to app.

Edit my profile button
Pop up wondow will appear requesting new username and password, user may simply enter one or more new details and click the save changes button.
Changes will be implemented immediately.

Change user status button
Pop up window will appear requesting a selection of a user whos status is to be changed, the selections consists of a dropdwon manu containing all usernames, user_ids and current status of each user.
After a user is selected and the confirm change button is pressed the change will be implemented immediately.

Delete user button 
Pop up window will appear requesting a selection of a user who is meant to be deleted, the selection consists of a dropdown manu containing all usernames and their user ids.
one a user is selected and the delete user button is pressed, the user will be deleted from the database and will not be able to log back in.


Designed for testing capabilities purposes.
License
This project is licensed under a custom license:

You may use, copy, and modify the code for personal or non-profit purposes for free.
If you wish to use the code in any commercial or for profit product, you must contact the author and may be required to pay a fee or share profits.

© 2025 Eden Vilinsky
All rights reserved.
