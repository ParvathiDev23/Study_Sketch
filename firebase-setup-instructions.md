# Firebase Setup Instructions

You need to do these steps in the Firebase Console: [console.firebase.google.com](https://console.firebase.google.com)

## 1. Create Firestore Indexes (Required)

Go to **Firestore Database → Indexes → Composite** and create these indexes:

### Index 1: Exams (ordered by date)
- **Collection:** `exams`
- **Fields:**
  - `userId` — Ascending  
  - `examDate` — Ascending
- **Query scope:** Collection

### Index 2: Flashcard Decks (ordered by date)
- **Collection:** `flashcardDecks`
- **Fields:**
  - `userId` — Ascending  
  - `createdAt` — Descending
- **Query scope:** Collection

### Index 3: Sticky Notes (ordered by date)
- **Collection:** `stickyNotes`
- **Fields:**
  - `userId` — Ascending  
  - `createdAt` — Descending
- **Query scope:** Collection

> **Shortcut:** The first time you use each feature, the browser console will show an error with a direct link to create the required index automatically. Just click the link!

## 2. Firestore Security Rules (Recommended)

Go to **Firestore Database → Rules** and replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // All other user-scoped collections
    match /{collection}/{docId} {
      allow read, write: if request.auth != null 
        && resource == null 
        || (request.auth != null && resource.data.userId == request.auth.uid);
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## 3. Done!

The app is ready. The test mode rules will work for 30 days. Set the proper rules above before that period expires.
