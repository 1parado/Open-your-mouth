# Shared Code

This directory contains shared code between web and mobile platforms.

## Structure

```
shared/
├── src/
│   └── types/      # Shared TypeScript type definitions
│       └── common.ts
└── package.json
```

## Usage

### Web
Import from shared types:
```typescript
import { User, Course, Lesson } from '@shared/types';
```

### Mobile
Import from shared types (requires setup):
```dart
// Types are redefined in Dart for type safety
```

## Shared Types

- `User` - User account information
- `Course` - Course data structure
- `Lesson` - Individual lesson within a course
- `PracticeSession` - Practice session record
- `ApiResponse` - Standard API response wrapper
- `ApiError` - API error structure
