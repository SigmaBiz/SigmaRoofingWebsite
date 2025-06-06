# Master Context Documentation

This folder contains progressive documentation snapshots taken at ~20% context usage intervals to maintain conversation continuity across auto-compaction events.

## Purpose
- Preserve critical technical decisions and solutions
- Track project evolution and changes
- Maintain context for debugging and future development
- Document key code changes and their rationale

## Structure
Each context file is numbered sequentially and includes:
1. Date and context usage percentage
2. Key accomplishments in that session
3. Technical decisions made
4. Problems solved
5. Pending issues
6. Important code snippets or configurations

## Current Context Files

### [001-initial-setup-and-mvp3-integration.md](./001-initial-setup-and-mvp3-integration.md)
- Initial deployment and MVP3 form integration
- Address validation and form improvements
- Git workflow setup

### [002-image-persistence-and-gaf-compliance.md](./002-image-persistence-and-gaf-compliance.md)
- Image persistence issues and solutions
- GAF trademark compliance implementation
- Mobile vs desktop rendering differences

### [003-fallback-images-and-replit-debugging.md](./003-fallback-images-and-replit-debugging.md)
- Complete replacement of ALL Unsplash images with real Cloudinary images
- Replit debugging: TypeScript errors, server binding, port configuration
- Three-tier fallback system implementation
- Data restoration scripts for localStorage recovery
- Persistent text update issue despite multiple debugging attempts
- Current context: ~60-80% usage

## How to Use
1. When context reaches ~20%, create a new numbered file
2. Include all critical information from that session
3. Reference previous files for continuity
4. Update this README with the new file entry

## Quick Reference

### Key Scripts Created
- `verify-and-set-images.js` - Image restoration
- `restore-projects-from-json.js` - Project restoration with trademark compliance
- `restore-all-data.js` - Complete data restoration
- `diagnose-images.js` - Image debugging
- `fix-hero-image-wrapped.js` - Hero background fixes

### Important Configurations
- Server binding: `0.0.0.0:3000` (changed from `127.0.0.1`)
- Replit port: 3000 (changed from 5000 in `.replit`)
- Storage: In-memory (needs database implementation)

### Critical Files Modified
- `/client/src/index.css` - Hero background fallback
- `/client/src/components/projects.tsx` - Project fallbacks
- `/client/src/components/services.tsx` - Service image fallbacks
- `/client/src/components/about.tsx` - About section fallbacks
- `/server/storage.ts` - In-memory storage (root cause of persistence issues)