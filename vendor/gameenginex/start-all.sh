#!/bin/bash

echo "Starting SYSTEM X Backend on port 8000..."
cd systemx && python3 -m uvicorn api:app --host 0.0.0.0 --port 8000 &
SYSTEMX_PID=$!

echo "Starting Game Server on port 5000..."
cd ..
npm run dev &
GAME_PID=$!

echo "Services started!"
echo "SYSTEM X Backend PID: $SYSTEMX_PID"
echo "Game Server PID: $GAME_PID"
echo ""
echo "To stop services:"
echo "  kill $SYSTEMX_PID $GAME_PID"

wait
