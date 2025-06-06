# Technical Debugging Request - Webview Stuck Loading

I need technical debugging help for my existing Express/React application. The server is running but the Replit webview won't connect.

## The Technical Issue:
My Express server is running successfully on port 3000, but the Replit webview is stuck with a loading spinner. I need to diagnose the connection problem between the webview and my running server.

## Server Status (Confirmed Working):
```
> NODE_ENV=development tsx server/index.ts
Storm Data Service initialized
5:42:42 AM [express] serving on port 3000
Server accessible at http://localhost:3000
```

## Recent Changes That May Have Caused This:
1. Changed port from 5000 to 3000 in .replit file
2. Changed server binding from '127.0.0.1' to '0.0.0.0'
3. The server was working before these changes

## Current .replit Configuration:
```
run = "npm run dev"

[[ports]]
localPort = 3000
externalPort = 80

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run dev"
waitForPort = 3000
```

## Specific Technical Questions:
1. How do I clear the Replit webview/proxy cache?
2. Is the Replit proxy still trying to connect to port 5000?
3. What's the exact external URL format for my Repl?
4. Do I need to add any special headers or configurations for the Replit proxy?
5. Is there a console command to reset the webview connection?

## What I Need:
1. The correct external URL to bypass the webview and access directly
2. Steps to force the webview to reconnect to the new port
3. Any missing .replit configurations for the proxy

This is purely a technical connection issue - the application itself is working. I just need to restore the connection between Replit's webview and my server on port 3000.