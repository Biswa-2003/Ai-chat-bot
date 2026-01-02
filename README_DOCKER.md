# Docker Setup Instructions

This project is fully containerized using Docker and Docker Compose. It includes the following services:
- **Backend**: FastAPI (Python) running on port 8000
- **Frontend**: React (Vite) running on port 5173
- **Database**: PostgreSQL running on port 5432
- **Database GUI**: pgAdmin running on port 5050

## Prerequisites
- Docker Desktop installed and running.

## Running the Application

1. **Build and Start Containers**
   Run the following command in the project root:
   ```bash
   docker-compose up --build
   ```

2. **Access the Application**
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **pgAdmin**: [http://localhost:5050](http://localhost:5050)

3. **pgAdmin Login Credentials**
   - **Email**: `admin@example.com`
   - **Password**: `admin123`

   **To connect to the database in pgAdmin:**
   - **Host**: `db` (This is the docker service name)
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: `admin123`

## Configuration
The database connection settings are automatically injected via `docker-compose.yml`. 
The existing `server/.env` file is used for other secrets (like `OPENROUTER_API_KEY`), but `DB_HOST` is overridden to `db` automatically inside the container.

## Stopping the Application
To stop the containers:
```bash
docker-compose down
```
To stop and remove volumes (reset database):
```bash
docker-compose down -v
```
