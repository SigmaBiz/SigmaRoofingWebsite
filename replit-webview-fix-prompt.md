# Replit Webview Not Connecting to Running Server

My Express server is running perfectly on port 3000 with 0.0.0.0 binding, but the Replit webview won't connect. This is NOT a code issue - the server works fine.

## Proof Server is Working:
```
12:55:15 AM [express] serving on port 3000
Server accessible at http://localhost:3000
Also try: http://0.0.0.0:3000
```

## The Problem:
- Webview shows endless loading spinner
- Server is confirmed running
- Changed from port 5000 to 3000 recently
- Already binding to 0.0.0.0 (not 127.0.0.1)

## I Need Specific Replit Platform Help:
1. **What is my Repl's external URL?** (the https://....repl.co address)
2. **How do I force refresh the Replit webview proxy?**
3. **Is there a command to clear Replit's webview cache?**
4. **How do I make Replit's proxy recognize the port change from 5000 to 3000?**

This is a Replit webview/proxy issue, NOT a code issue. The server is running perfectly. I just can't access it through the Replit webview.

Please provide:
- My specific Repl URL
- Steps to reset/refresh the webview connection
- Any Replit-specific commands or buttons to fix this