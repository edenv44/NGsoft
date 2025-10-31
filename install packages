import subprocess
import sys

# list of packages to install
packages = [
    "fastapi",
    "uvicorn",
    "sqlalchemy",
    "pymysql",
    "pydantic"
]

# functions to install
def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# install all packages
for package in packages:
    print(f"Installing {package}...")
    install(package)

print("All packages installed successfully!")
