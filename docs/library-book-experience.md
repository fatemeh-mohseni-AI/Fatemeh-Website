# Library Book Experience

## Overview

The Library book experience adds a physical book discovery layer on top of the existing Persian reading room.

## Architecture

- `BookScene`: physical book interaction point.
- `BookViewer`: immersive reading state.
- `PageFlip`: future drag-based page transition.
- `lib/garden/books.ts`: book content source.

## Adding books

Add new entries to `books.ts`. Components should not contain book-specific content.

## Future improvements

- realistic Three.js book model
- drag based page physics
- admin content management
- reading history
- personal annotations
