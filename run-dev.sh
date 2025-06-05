#!/bin/bash

# Start the backend server in the background
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start the frontend dev server
echo "Starting frontend server..."
cd client && npm run dev &
FRONTEND_PID=$!

echo "Both servers started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID" INT
wait